// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoft-creator-package.helloWorld', () => {
		const terminal = vscode.window.createTerminal(`Bpmsoft Terminal`);
		terminal.show(true);
		terminal.sendText("echo 'Sent text immediately after creating'");
	}));

	const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
	const api = gitExtension.getAPI(1);

	const repo = api.repositories[0];
	const head = repo.state.HEAD;

	// Get the branch and commit 
	const {commit,name: branch} = head;


	console.log({ branch, commit });
}

// This method is called when your extension is deactivated
export function deactivate() {}
