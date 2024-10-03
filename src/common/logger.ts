import * as vscode from 'vscode';
import { ILoggerConfig } from '../interfaces';
import { ExtensionSettings } from './extensionSettings';
import { FolderType } from '../constants';

export class Logger implements ILoggerConfig {
	private static terminalLog: vscode.OutputChannel;

	public readonly terminalName = ExtensionSettings.terminalName;
	public readonly outputPathLog = ExtensionSettings.outputPath(FolderType.terminal);
	public readonly executeResultFileName = 'commandExecuteResult.log';
	public readonly executeLogFileName = 'commandExecute.log';

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(ExtensionSettings.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}
}