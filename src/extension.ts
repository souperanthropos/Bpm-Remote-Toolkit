// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

import { EnvironmentsProvider, serverTreeItem } from './environments';
import { serverSettings, appSettings } from './interfaces';

let terminalLog: vscode.OutputChannel;
let terminal: vscode.Terminal;
let environments: serverSettings[] | undefined;

const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });

function getDirectoryName(localPath: string) : string {
	const path = require("path");
	return path.basename(localPath);
}

function checkWorkspaceSettings(){
	const workspaceConfig = vscode.workspace.getConfiguration('cwServers');
	const serverTest = workspaceConfig.get<serverSettings>('test');
	const serverPreprod = workspaceConfig.get<serverSettings>('preprod');
	const serverProd = workspaceConfig.get<serverSettings>('prod');

	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');

	if(serverTest !== undefined && serverTest.isEnable){
		vscode.commands.executeCommand('setContext', 'isShowTestApp', true);
	}else{
		vscode.commands.executeCommand('setContext', 'isShowTestApp', false);
	}

	if(serverPreprod !== undefined && serverPreprod.isEnable){
		vscode.commands.executeCommand('setContext', 'isShowPreprodApp', true);
	}else{
		vscode.commands.executeCommand('setContext', 'isShowPreprodApp', false);
	}

	if(serverProd !== undefined && serverProd.isEnable){
		vscode.commands.executeCommand('setContext', 'isShowProdApp', true);
	}else{
		vscode.commands.executeCommand('setContext', 'isShowProdApp', false);
	}
}

async function isPermittedBranch(branchName: string | undefined) : Promise<boolean> {
	const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;

	terminalLog.show(true);

	if (!gitExtension.enabled) {
		console.warn("Git extension not active");
		terminalLog.appendLine("Git extension not active");
		return false;
	}
	
	const api = gitExtension.getAPI(1);
	const repo = api.repositories[0];
	if(repo === undefined){
		terminalLog.appendLine("Git extension not active");
		return false;
	}

    //Get all changes for first repository in list
	const changes = await repo.diffWithHEAD();
	//Print out array of changes
	if(changes.length > 0){
		terminalLog.appendLine('Error: Uncommitted changes detected.');
		return false;
	}

	const head = repo.state.HEAD;
	const {commit,name: branch} = head;
	console.log({ branch, commit });

	if(branchName){
		if(branch === branchName){
			return true;
		}

		terminalLog.appendLine('Please select branch: ' + branchName);
		return false;
	}
	else{
		if(branch === 'develop' || branch === 'preprod' || branch === 'master'){
			return true;
		}
	
		console.error('Branch: ' + branch + 'not permitted');
		terminalLog.appendLine('Branch: ' + branch + ' not permitted');
		terminalLog.appendLine('Please select branch: develop, preprod or master');
		return false;
	}
}

async function createPackage(targetFolderPath: string) : Promise<boolean> {
	const path = require("path");
	const config = vscode.workspace.getConfiguration('clio');
	const outputPath = config.get('outputPath');

	terminalLog.appendLine('del ' + path.join(outputPath, getDirectoryName(targetFolderPath) + '.gz'));
	await execShell('del ' + path.join(outputPath, getDirectoryName(targetFolderPath) + '.gz'));

	terminalLog.appendLine('Execute: clio generate-pkg-zip ' + targetFolderPath + ' -d ' + path.join(outputPath, getDirectoryName(targetFolderPath) + '.gz'));
	try{
		const result = await execShell("clio generate-pkg-zip " + targetFolderPath + " -d " + path.join(outputPath, getDirectoryName(targetFolderPath) + ".gz"));
		terminalLog.appendLine('Result: ' + result);
		return true;
	}
	catch(error){
		terminalLog.appendLine('Error: ' + error);
		return false;
	}
}

function pushPackage(settings: appSettings) {
	const path = require("path");

	if(settings.targetRemoteUrl === undefined || settings.targetRemoteUrl === ''){
		terminalLog.appendLine('Error: incorrect server');
		return;
	}

	if(settings.gitBranchName === undefined || settings.gitBranchName === ''){
		terminalLog.appendLine('Error: incorrect branchName');
		return;
	}

	if(settings.remoteLogin === '' || settings.remotePassword === ''){
		terminalLog.appendLine('Error: Go to settings extension and fill Login and Password for ' + settings.gitBranchName);
		return;
	}

	const config = vscode.workspace.getConfiguration('clio');
	const outputPath = config.get('outputPath');
	
	terminal.show(true);
	terminal.sendText(
		'clear \n $OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding \n' +
		'clio push-pkg ' 
		+ path.join(outputPath, getDirectoryName(settings.targetFolderPath) + ".gz") 
		+ ' -u ' + settings.targetRemoteUrl 
		+ ' -l ' + settings.remoteLogin 
		+ ' -p ' + settings.remotePassword
	);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	if( terminalLog === undefined){
		terminalLog = vscode.window.createOutputChannel("cliowrapper");
	}
	if(terminal === undefined){
		terminal = vscode.window.createTerminal(`cliowrapper`);
	}

	checkWorkspaceSettings();

	const environmentsProvider = new EnvironmentsProvider();
	vscode.window.registerTreeDataProvider('bpmsoftEnvironments', environmentsProvider);

	vscode.commands.registerCommand('bpmsoftEnvironments.refreshEntry', () => {
		if(environments){
			environments?.forEach(env=>{
				var isReg = context.globalState.get(env.id);
				if(isReg){
					env.isRegister = true;
				}else{
					env.isRegister = false;
				}
			});
			environmentsProvider.refresh(environments);
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('clio.openSettings', () => {
		terminal.sendText("clear \n clio open-settings");
		terminalLog.appendLine('Open settings...');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.register', async (server: serverSettings) => {
		const loginQuery = await vscode.window.showInputBox({
			placeHolder: "Enter login",
			prompt: "Add login for Bpmsoft"
		});
		if(loginQuery !== ''){
			const passwordQuery = await vscode.window.showInputBox({
				placeHolder: "Enter password",
				prompt: "Add login for Bpmsoft"
			});
			if(passwordQuery !== ''){
				const result = await execShell(
					"clio reg-web-app "
					+ server.id
					+ " -u " + server.url
					+ " -l " + loginQuery
					+ " -p " + passwordQuery);
				terminalLog.appendLine('Result: ' + result);
				context.globalState.update(server.id, true);
				vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.delete', async (server: serverSettings) => {
		const result = await execShell(
			"clio unreg-web-app "
			+ server.id);
		terminalLog.appendLine('Result: ' + result);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.create', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);
		if(await isPermittedBranch(undefined)){
			//await createPackage(uri.fsPath);
			const arr = ["test", "preprod", "prod"];
			const quickPickItems = arr.map(item => ( { label: item, iconPath: new vscode.ThemeIcon('device-desktop') } ) );
			const qp = vscode.window.createQuickPick();
			qp.canSelectMany = false;
			qp.items = quickPickItems;
			qp.onDidChangeSelection(selection => {
				var k=0;
			});
			qp.onDidHide(() => qp.dispose());
			qp.show();
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		checkWorkspaceSettings();
    }));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.createandsend.totest', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		const config = vscode.workspace.getConfiguration('clio');
		const remoteTestLogin = config.get<string>('bpmSoft.test.login');
		const remoteTestPassword = config.get<string>('bpmSoft.test.password');

		const workspaceConfig = vscode.workspace.getConfiguration('cwServers');
		const serverConfig = workspaceConfig.get<serverSettings>('test');

		if(await isPermittedBranch(serverConfig?.gitBranchName)){
			var result = await createPackage(uri.fsPath);
			if(result){
				pushPackage({
					targetFolderPath: uri.fsPath,
					targetRemoteUrl: serverConfig?.url,
					remoteLogin: remoteTestLogin,
					remotePassword: remoteTestPassword,
					gitBranchName: serverConfig?.gitBranchName
				});
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.createandsend.topreprod', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		const config = vscode.workspace.getConfiguration('clio');
		const remotePreprodLogin = config.get<string>('bpmSoft.preprod.login');
		const remotePreprodPassword = config.get<string>('bpmSoft.preprod.password');

		const workspaceConfig = vscode.workspace.getConfiguration('cwServers');
		const serverConfig = workspaceConfig.get<serverSettings>('preprod');

		if(await isPermittedBranch(serverConfig?.gitBranchName)){
			var result = await createPackage(uri.fsPath);
			if(result){
				pushPackage({
					targetFolderPath: uri.fsPath,
					targetRemoteUrl: serverConfig?.url,
					remoteLogin: remotePreprodLogin,
					remotePassword: remotePreprodPassword,
					gitBranchName: serverConfig?.gitBranchName
				});
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.createandsend.toprod', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		const config = vscode.workspace.getConfiguration('clio');
		const remoteProdLogin = config.get<string>('bpmSoft.prod.login');
		const remoteProdPassword = config.get<string>('bpmSoft.prod.password');

		const workspaceConfig = vscode.workspace.getConfiguration('cwServers');
		const serverConfig = workspaceConfig.get<serverSettings>('prod');

		if(await isPermittedBranch(serverConfig?.gitBranchName)){
			var result = await createPackage(uri.fsPath);
			if(result){
				pushPackage({
					targetFolderPath: uri.fsPath,
					targetRemoteUrl: serverConfig?.url,
					remoteLogin: remoteProdLogin,
					remotePassword: remoteProdPassword,
					gitBranchName: serverConfig?.gitBranchName
				});
			}
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}