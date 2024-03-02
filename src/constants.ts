import * as vscode from 'vscode';
import { serverSettings } from './interfaces';

export class Constants {
	static readonly executeResultFileName = '\\commandExecuteResult.log';
	static readonly executeLogFileName = '\\commandExecute.log';
	static extensionPath = '';
	static environments: serverSettings[] | undefined;
}

export function getDirectoryName(localPath: string): string {
	const path = require("path");
	return path.basename(localPath);
}

export function isNullOrWhitespace(input: string | undefined) {
	return !input || !input.trim();
}

export const hash = function () {
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const crypto = require('crypto');
		return crypto.createHash('md5').update(folder).digest('hex');
	}
	return '';
};

export const isMatchingWorkspace = function (sourcePath: string) : boolean {
	const path = require('path');
	const wsFolder = vscode.workspace.workspaceFolders?.find(
		(wf) => {
			const relative = path.relative(wf.uri.fsPath, sourcePath);
			return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
		}
	);
	if(wsFolder){
		return true;
	}
	return false;
};

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