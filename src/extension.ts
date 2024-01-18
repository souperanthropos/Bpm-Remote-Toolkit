// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

let terminalLog: vscode.OutputChannel;

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

async function isPermittedBranch(branchName: string | undefined) : Promise<boolean> {
	const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
	if( terminalLog === undefined){
		terminalLog = vscode.window.createOutputChannel("cliowrapper");
	}

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

		terminalLog.appendLine('Please select branch: develop');
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

function pushPackage(targetFolderPath: string, targetRemoteUrl: string | undefined) {
	const path = require("path");
	const config = vscode.workspace.getConfiguration('clio');
	const outputPath = config.get('outputPath');
	const remoteLogin = config.get('bpmSoft.test.login');
	const remotePassword = config.get('bpmSoft.test.password');

	if(targetRemoteUrl === undefined){
		terminalLog.appendLine('Error: incorrect server');
		return;
	}

	if(remoteLogin === '' || remotePassword === ''){
		terminalLog.appendLine('Error: Go to settings extension and fill remoteTestLogin, remoteTestPassword');
		return;
	}

	const terminal = vscode.window.createTerminal(`cliowrapper`);
	terminal.show(true);
	terminal.sendText(
		'$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding \n' +
		'clio push-pkg ' 
		+ path.join(outputPath, getDirectoryName(targetFolderPath) + ".gz") 
		+ ' -u ' + targetRemoteUrl 
		+ ' -l ' + remoteLogin 
		+ ' -p ' + remotePassword
	);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.create', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		if(await isPermittedBranch(undefined)){
			await createPackage(uri.fsPath);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.createandsend.totest', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		const workspaceConfig = vscode.workspace.getConfiguration('cwServers');
		const serverUrl = workspaceConfig.get<string>('test');

		if(await isPermittedBranch('develop')){
			var result = await createPackage(uri.fsPath);
			if(result){
				pushPackage(uri.fsPath, serverUrl);
			}
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}