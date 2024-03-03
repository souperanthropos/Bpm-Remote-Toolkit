import * as vscode from 'vscode';

export class TerminalWrapper {
	private readonly executeResultFileName = 'commandExecuteResult.log';
	private readonly executeLogFileName = 'commandExecute.log';

	public readonly executeLogFilePath: string;
	public readonly executeResultFilePath: string;

	constructor(private outputPathLog: string) {
		this.executeLogFilePath = `${this.outputPathLog}\\${this.executeLogFileName}`;
		this.executeResultFilePath = `${this.outputPathLog}\\${this.executeResultFileName}`;
	}

	public async callInInteractiveTerminalWithoutLog(command: string): Promise<vscode.TerminalExitStatus> {
		const terminal = vscode.window.createTerminal({
			name: 'cliowrapper',
			location: vscode.TerminalLocation.Panel,
		});
		terminal.show(true);
		terminal.sendText(command, false);
		terminal.sendText("; exit");
		return new Promise((resolve, reject) => {
			const disposeToken = vscode.window.onDidCloseTerminal(
				async (closedTerminal) => {
					if (closedTerminal === terminal) {
						disposeToken.dispose();
						if (terminal.exitStatus !== undefined) {
							resolve(terminal.exitStatus);
						} else {
							reject("Terminal exited with undefined status");
						}
					}
				}
			);
		});
	}

	public async callInInteractiveTerminal(command: string): Promise<boolean> {
		const terminal = vscode.window.createTerminal({
			name: 'cliowrapper',
			location: vscode.TerminalLocation.Panel,
		});
		
		terminal.show(true);
		terminal.sendText("$share = ", false);
		terminal.sendText(command + ` | Tee-Object -file ${this.executeLogFilePath} `, false);
		terminal.sendText("; if($?){\"1\""
			+ ` > ${this.executeResultFilePath} ` + "}else{\"0\""
			+ ` > ${this.executeResultFilePath} ` + "}", false);
		terminal.sendText("; exit");
		return new Promise((resolve, reject) => {
			const disposeToken = vscode.window.onDidCloseTerminal(
				async (closedTerminal) => {
					if (closedTerminal === terminal) {
						disposeToken.dispose();
						var pathFile = vscode.Uri.file(this.executeResultFilePath);
						const readData = await vscode.workspace.fs.readFile(pathFile);
						const readStatus = Buffer.from(readData).toString('utf8');
						if (terminal.exitStatus !== undefined) {
							if (readStatus.includes('1')) {
								resolve(true);
							} else {
								resolve(false);
							}
						} else {
							reject("Terminal exited with undefined status");
						}
					}
				}
			);
		});
	}
}