import * as vscode from 'vscode';
import path from "path";
import { ExecuteOptions, TerminalWrapper } from "./terminalwrapper";

export class PowerShellWrapper extends TerminalWrapper {
	private readonly setEncodingUtf8 = '$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding;';
	private readonly executeResultFileName = 'commandExecuteResult.log';
	private readonly tempFileName = 'tmp.log';
	private readonly tempFilePath: string;
	private readonly executeResultFilePath: string;

	private errorOutputToSuccessOutputCommand: string = '';

	constructor(rootDirPath: string, terminalName: string) {
		super(rootDirPath, terminalName);
		this.tempFilePath = path.join(rootDirPath, this.tempFileName);
		this.executeResultFilePath = path.join(rootDirPath, this.executeResultFileName);
	}

	public async executeCommand(command: string, options: ExecuteOptions): Promise<boolean> {
		const terminal = this.getTerminal();

		if(!options.useErrorOutputToSuccessOutput){
			this.errorOutputToSuccessOutputCommand = '';
		}else{
			this.errorOutputToSuccessOutputCommand = '2>&1 ';
		}
		
		terminal.show(true);
		terminal.sendText(`$share = ${this.setEncodingUtf8}`, false);
		terminal.sendText(`${command} ${this.errorOutputToSuccessOutputCommand} | `, false);
		terminal.sendText(`ForEach-Object { Write-Output $_; $_ | Tee-Object -file ${this.tempFilePath} | `, false);
		terminal.sendText(`Out-File -FilePath ${this.executeLogFilePath} -Append -Encoding UTF8 };`, false);
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