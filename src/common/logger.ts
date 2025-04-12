import * as vscode from 'vscode';

export class Logger {
	private static terminalLog: vscode.OutputChannel;
	private static readonly terminalName = 'bpmtoolkit';

	public static writeToChannel(message: string) {
		if (this.terminalLog === undefined) {
			this.terminalLog = vscode.window.createOutputChannel(Logger.terminalName);
		}
		this.terminalLog.show(true);
		this.terminalLog.appendLine(message);
	}
}