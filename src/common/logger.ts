import * as vscode from 'vscode';
import { ExtensionSettings } from './extensionSettings';
import { FolderType } from '../constants';

export class Logger {
	private static terminalLog: vscode.OutputChannel;
	private static outputPathLog = '';
	private static readonly executeResultFileName = 'commandExecuteResult.log';
	private static executeLogFileName = 'commandExecute.log';

	public static readonly terminalName = ExtensionSettings.terminalName;

	public static getExecuteLogFilePath() : string {
		if(Logger.outputPathLog === ''){
			Logger.outputPathLog = ExtensionSettings.outputPath(FolderType.terminal);
		}
		return `${Logger.outputPathLog}\\${Logger.executeLogFileName}`;
	}

	public static getExecuteResultFileName() : string {
		if(Logger.outputPathLog === ''){
			Logger.outputPathLog = ExtensionSettings.outputPath(FolderType.terminal);
		}
		return `${Logger.outputPathLog}\\${Logger.executeResultFileName}`;
	}

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(ExtensionSettings.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}
}