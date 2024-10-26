import * as vscode from 'vscode';
import { ExtensionSettings } from './extensionSettings';
import { FolderType } from '../constants';
import { PowerShellWrapper, TerminalWrapper } from '../terminal/terminalwrapper';

export class Logger {
	private static terminalLog: vscode.OutputChannel;
	private static terminal: TerminalWrapper;
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

	public static async writeToExecuteLogFile(message: string, writeTimestamp: boolean) {
		if (this.terminal === undefined) {
			this.terminal = new PowerShellWrapper(false);
		}
		await this.terminal.addTextToLogFile(message, writeTimestamp);
	}
}