import * as vscode from 'vscode';
import { enviromentSettings } from './interfaces';

export class ExtensionSettings {
	static autoUpdateTime = false;
	static outputPath = '';

	static terminalName = 'bpmtoolkit';
	static extensionPath = '';
	static environments: enviromentSettings[] | undefined;
}

export class Logger {
	private static terminalLog: vscode.OutputChannel;

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(ExtensionSettings.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}
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

export const showErrorMessage = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) => {
	const buttonShowLog = showbutton ? "Show log file" : '';
	vscode.window.showErrorMessage(message, buttonShowLog)
		.then(selection => {
			if (selection === buttonShowLog && executeLogFilePath) {
				const folderUri = vscode.Uri.file(executeLogFilePath);
				vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
			}
		});
};

export const showInformationMessage = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) => {
	const buttonShowLog = showbutton ? "Show log file" : '';
	vscode.window.showInformationMessage(message, buttonShowLog)
		.then(selection => {
			if (selection === buttonShowLog && executeLogFilePath) {
				const folderUri = vscode.Uri.file(executeLogFilePath);
				vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
			}
		});
};