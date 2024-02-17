// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

import { EnvironmentsProvider } from './environments';
import { GitHelper } from './git';
import { serverSettings, packageSettings } from './interfaces';

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
	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	if(environments && environments.length > 0){
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
	}else{
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
	}

	vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
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

function pushPackage(settings: packageSettings) {
	const path = require("path");

	if(settings.targetEnviroment === undefined || settings.targetEnviroment === ''){
		terminalLog.appendLine('Error: target enviroment not found');
		return;
	}

	const config = vscode.workspace.getConfiguration('clio');
	const outputPath = config.get('outputPath');
	
	terminal.show(true);
	terminal.sendText(
		'clear \n $OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding \n' +
		'clio push-pkg ' 
		+ path.join(outputPath, getDirectoryName(settings.targetFolderPath) + ".gz") 
		+ ' -e ' + settings.targetEnviroment
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

	const gitHelper = new GitHelper(terminalLog);

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
		}else{
			environmentsProvider.refresh([]);
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('clio.openSettings', () => {
		terminal.show(true);
		terminal.sendText("clear \n clio open-settings");
		terminalLog.appendLine('Open settings...');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.restart', (server: serverSettings) => {
		if(!server.isEnable){
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			  );
		}else{
			terminal.show(true);
			terminal.sendText(
				"clear \n clio restart-web-app "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.redis.clear', (server: serverSettings) => {
		if(!server.isEnable){
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			  );
		}else{
			terminal.show(true);
			terminal.sendText(
				"clear \n clio clear-redis-db "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.compileConfiguration', (server: serverSettings) => {
		if(!server.isEnable){
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			  );
		}else{
			terminal.show(true);
			terminal.sendText(
				"clear \n clio compile-configuration "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.register', async (server: serverSettings) => {
		const loginQuery = await vscode.window.showInputBox({
			placeHolder: "Login",
			prompt: "Enter login for connecting to Bpmsoft"
		});
		if(loginQuery !== ''){
			const passwordQuery = await vscode.window.showInputBox({
				placeHolder: "Password",
				prompt: "Enter password for connecting to Bpmsoft",
				password: true
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

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.unregister', async (server: serverSettings) => {
		const result = await execShell(
			"clio unreg-web-app "
			+ server.id);
		terminalLog.appendLine('Result: ' + result);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.create', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);
		const path = require("path");
		const config = vscode.workspace.getConfiguration('clio');
		const outputPath = config.get<string>('outputPath');

		if(environments){
			const branches = environments.map(({ gitBranchName }) => gitBranchName ?? '' );

			if(await gitHelper.isPermittedBranch(branches)){
				await createPackage(uri.fsPath);
				if(outputPath){
					vscode.env.openExternal(vscode.Uri.file(outputPath));
				}
			}
		}else{
			vscode.window.showInformationMessage(
				"Command execute failed: check you .code-workspace file."
			  );
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		checkWorkspaceSettings();
    }));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.createandsend', (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		const currentBranch = gitHelper.getCurrentBranch();
		if(environments && currentBranch !== ''){
			const arr = environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id );
			const quickPickItems = arr.map(item => ( { label: item, iconPath: new vscode.ThemeIcon('device-desktop') } ) );
			const qp = vscode.window.createQuickPick();
			qp.canSelectMany = false;
			qp.items = quickPickItems;
			qp.onDidChangeSelection(async selection => {
				const serverId = selection[0].label;
				const serverConfig = environments?.find(e=>e.id === serverId);
				qp.hide();
				
				if(serverConfig && serverConfig.gitBranchName){
					if(await gitHelper.checkBranch(serverConfig.gitBranchName)){
							var result = await createPackage(uri.fsPath);
							if(result){
								pushPackage({
									targetFolderPath: uri.fsPath,
									targetEnviroment: serverConfig.id
								});
							}
					}
				}else{
					vscode.window.showInformationMessage(
						"Command execute failed: check you .code-workspace file."
					  );
				}
			});
			qp.onDidHide(() => qp.dispose());
			qp.show();
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}