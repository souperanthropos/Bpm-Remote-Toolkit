import * as vscode from 'vscode';
import { FileManager } from '../managers/filemanager';

export class Logger {
	private static terminalLog: vscode.OutputChannel;

	private static readonly fileManager = new FileManager();

	public static readonly terminalName = ExtensionSettings.terminalName;

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(ExtensionSettings.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}

	public static async writeToExecuteLogFile(message: string) {
		await this.fileManager.appendToFile(this.getExecuteLogFilePath(), message);
	}
}