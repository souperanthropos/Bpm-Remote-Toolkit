import * as vscode from 'vscode';
import { Constants } from './constants';

export class TerminalManager {

	constructor(private extensionPath: string) {
	}

	public async callInInteractiveTerminal(
		command: string
	): Promise<boolean> {
		const terminal = vscode.window.createTerminal({
			name: 'cliowrapper',
			location: vscode.TerminalLocation.Panel,
		});
		const executeLogFilePath = this.extensionPath + Constants.executeLogFileName;
		const executeResultFilePath = this.extensionPath + Constants.executeResultFileName;
		terminal.show(true);
		terminal.sendText("$share = ", false);
		terminal.sendText(command + ` | Tee-Object -file ${executeLogFilePath} `, false);
		terminal.sendText("; if($?){\"command succeeded\""
			+ ` > ${executeResultFilePath} ` + "}else{\"command failed\""
			+ ` > ${executeResultFilePath} ` + "}", false);
		terminal.sendText("; exit");
		return new Promise((resolve, reject) => {
			const disposeToken = vscode.window.onDidCloseTerminal(
				async (closedTerminal) => {
					if (closedTerminal === terminal) {
						disposeToken.dispose();
						var pathFile = vscode.Uri.file(executeResultFilePath);
						const readData = await vscode.workspace.fs.readFile(pathFile);
						const readStatus = Buffer.from(readData).toString();
						if (terminal.exitStatus !== undefined) {
							if (readStatus.includes('succeeded')) {
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