import * as vscode from 'vscode';

export class Constants {
    static readonly executeResultFileName = '\\commandExecuteResult.log';
    static readonly executeLogFileName = '\\commandExecute.log';
    static extensionPath = '';
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