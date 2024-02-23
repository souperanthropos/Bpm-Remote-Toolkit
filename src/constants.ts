import * as vscode from 'vscode';

export class Constants {
	static readonly executeResultFileName = '\\commandExecuteResult.log';
	static readonly executeLogFileName = '\\commandExecute.log';
	static extensionPath = '';
}

export function getDirectoryName(localPath: string): string {
	const path = require("path");
	return path.basename(localPath);
}

export function isNullOrWhitespace(input: string | undefined) {
	return !input || !input.trim();
}

export const showErrorMessage = (message: string, showbutton: boolean) => {
	const buttonShowLog = showbutton ? "Show log file" : '';
	vscode.window.showErrorMessage(message, buttonShowLog)
		.then(selection => {
			if (selection === buttonShowLog) {
				const folderUri = vscode.Uri.file(Constants.extensionPath + Constants.executeLogFileName);
				vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
			}
		});
};

export const showInformationMessage = (message: string, showbutton: boolean) => {
	const buttonShowLog = showbutton ? "Show log file" : '';
	vscode.window.showInformationMessage(message, buttonShowLog)
		.then(selection => {
			if (selection === buttonShowLog) {
				const folderUri = vscode.Uri.file(Constants.extensionPath + Constants.executeLogFileName);
				vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
			}
		});
};