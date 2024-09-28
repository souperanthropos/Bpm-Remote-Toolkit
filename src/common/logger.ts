import * as vscode from 'vscode';
import { ILoggerConfig } from '../interfaces';
import { ExtensionSettings } from './extensionSettings';
import { FolderType } from '../constants';

export class Logger implements ILoggerConfig {
	private static terminalLog: vscode.OutputChannel;

	public terminalName = ExtensionSettings.terminalName;
	public outputPathLog = ExtensionSettings.outputPath(FolderType.terminal);
	public executeResultFileName = 'commandExecuteResult.log';
	public executeLogFileName = 'commandExecute.log';

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(ExtensionSettings.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}
}