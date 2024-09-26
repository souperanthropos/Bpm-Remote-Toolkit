import * as vscode from 'vscode';
import { ILoggerConfig } from '../interfaces';

export class TerminalWrapper {
	private readonly setEncodingUtf8 = '$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding;';
	private readonly executeResultFilePath: string;

	public readonly executeLogFilePath: string;

	constructor(private config: ILoggerConfig) {
		this.executeLogFilePath = `${config.outputPathLog}\\${config.executeLogFileName}`;
		this.executeResultFilePath = `${config.outputPathLog}\\${config.executeResultFileName}`;
	}

	public async executeCommand(command: string, rewriteLogFile: boolean): Promise<boolean> {
		let terminal = vscode.window.terminals.find(i => i.name === this.config.terminalName);
		if (!terminal) {
			terminal = vscode.window.createTerminal({
				name: this.config.terminalName,
				location: vscode.TerminalLocation.Panel,
			});
		}
		
		terminal.show(true);
		if(rewriteLogFile){
			terminal.sendText(`$share = ${this.setEncodingUtf8} ${command} 2>&1 | Tee-Object -file ${this.executeLogFilePath};`, false);
		}else{
			terminal.sendText(`$share = ${this.setEncodingUtf8} ${command} 2>&1 | Tee-Object -file ${this.executeLogFilePath} -Append;`, false);
		}
		terminal.sendText(`if($?){'1' > ${this.executeResultFilePath}}else{'0' > ${this.executeResultFilePath}}`, false);
		terminal.sendText(";exit");
		return new Promise((resolve, reject) => {
			const disposeToken = vscode.window.onDidCloseTerminal(
				async (closedTerminal) => {
					if (closedTerminal === terminal) {
						disposeToken.dispose();
						if (terminal.exitStatus !== undefined) {
							var pathFile = vscode.Uri.file(this.executeResultFilePath);
							const readData = await vscode.workspace.fs.readFile(pathFile);
							const readStatus = Buffer.from(readData).toString('utf8');
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