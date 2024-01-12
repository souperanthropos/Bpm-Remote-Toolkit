// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

let terminalLog: vscode.OutputChannel;

function isPermittedBranch() : boolean {
	const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
	if( terminalLog === undefined){
		terminalLog = vscode.window.createOutputChannel("BCP");
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

	if(branch === 'develop' || branch === 'preprod' || branch === 'master'){
		return true;
	}

	console.error('Branch: ' + branch + 'not permitted');
	terminalLog.appendLine('Branch: ' + branch + ' not permitted');
	terminalLog.appendLine('Please select branch: develop, preprod or master');
	return false;
}

const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoft-creator-package.create', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);
		
		const path = require("path");
		const parentDirectory = path.basename(uri.fsPath);
		
		const config = vscode.workspace.getConfiguration('bcp');
		const outputPath = config.get('outputPath');

		if(isPermittedBranch()){
			const terminal = vscode.window.createTerminal(`Bpmsoft Terminal`);
			terminal.show(true);
			//terminal.sendText("clio generate-pkg-zip " + uri.fsPath + " -d " + path.join(outputPath, parentDirectory + ".gz"));
			terminalLog.appendLine('Execute: clio generate-pkg-zip ' + uri.fsPath + ' -d ' + path.join(outputPath, parentDirectory + '.gz'));
			try{
				const result = await execShell("clio generate-pkg-zip " + uri.fsPath + " -d " + path.join(outputPath, parentDirectory + ".gz"));
				terminalLog.appendLine('Result: ' + result);
				if(result.includes('Done')){
					//vscode.commands.executeCommand(`vscode.openFolder`, outputPath);
				}
			}
			catch(error){
				terminalLog.appendLine('Error: ' + error);
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoft-creator-package.test.createandsend', async (uri:vscode.Uri) => {
		console.log(uri.fsPath);
		
		const path = require("path");
		const parentDirectory = path.basename(uri.fsPath);
		
		const config = vscode.workspace.getConfiguration('bcp');
		const outputPath = config.get('outputPath');
		const remoteServer = config.get('remoteServer');
		const remoteServerLogin = config.get('remoteServerLogin');
		const remoteServerPassword = config.get('remoteServerPassword');

		if(isPermittedBranch()){
			const terminal = vscode.window.createTerminal(`Bpmsoft Terminal`);
			terminal.show(true);
			//terminal.sendText("clio generate-pkg-zip " + uri.fsPath + " -d " + path.join(outputPath, parentDirectory + ".gz"));
			terminalLog.appendLine('Execute: clio generate-pkg-zip ' + uri.fsPath + ' -d ' + path.join(outputPath, parentDirectory + '.gz'));
			const result = await execShell("clio generate-pkg-zip " + uri.fsPath + " -d " + path.join(outputPath, parentDirectory + ".gz"));
			terminalLog.appendLine('Result: ' + result);
			if(result.includes('Done')){
				//vscode.commands.executeCommand(`vscode.openFolder`, outputPath);
				terminalLog.appendLine(
					'Execute: clio push-pkg ' 
					+ path.join(outputPath, parentDirectory + ".gz") 
					+ ' -u ' + remoteServer 
					+ ' -l ' + remoteServerLogin 
					+ ' -p ' + remoteServerPassword
				);
				try{
					const pushResult = await execShell(
						'Execute: clio push-pkg ' 
						+ path.join(outputPath, parentDirectory + ".gz") 
						+ ' -u ' + remoteServer 
						+ ' -l ' + remoteServerLogin 
						+ ' -p ' + remoteServerPassword
					);
					terminalLog.appendLine('Result: ' + pushResult);
				}
				catch(error){
					terminalLog.appendLine('Error: ' + error);
				}
			}
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}