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

function isPermittedBranch(branchName: string | undefined) : boolean {
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
	const config = vscode.workspace.getConfiguration('cw');
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

function pushPackage(targetFolderPath: string) {
	const path = require("path");
	const config = vscode.workspace.getConfiguration('cw');
	const outputPath = config.get('outputPath');
	const remoteServer = 'https://10.252.60.234:10443';
	const remoteServerLogin = config.get('remoteTestServerLogin');
	const remoteServerPassword = config.get('remoteTestServerPassword');

	if(remoteServerLogin === '' || remoteServerPassword === ''){
		terminalLog.appendLine('Error: Go to settings extension and fill remoteTestServerLogin, remoteTestServerPassword');
		return;
	}

	const terminal = vscode.window.createTerminal(`cliowrapper`);
	terminal.show(true);
	terminal.sendText(
		'clio push-pkg ' 
		+ path.join(outputPath, getDirectoryName(targetFolderPath) + ".gz") 
		+ ' -u ' + remoteServer 
		+ ' -l ' + remoteServerLogin 
		+ ' -p ' + remoteServerPassword
	);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.create', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);

		if(isPermittedBranch(undefined)){
			await createPackage(uri.fsPath);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.test.createandsend', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);
		
		const path = require("path");
		const parentDirectory = path.basename(uri.fsPath);
		
		const config = vscode.workspace.getConfiguration('bcp');
		const outputPath = config.get('outputPath');


		if(isPermittedBranch('develop')){
			var result = await createPackage(uri.fsPath);
			if(result){
				pushPackage(uri.fsPath);
			}
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}