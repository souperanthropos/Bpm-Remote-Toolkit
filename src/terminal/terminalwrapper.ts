import * as vscode from 'vscode';
import * as cp from "child_process";
import { Logger } from '../common/logger';

export type ExecuteOptions = { 
	useErrorOutputToSuccessOutput: boolean
};

export abstract class TerminalWrapper {
	abstract executeSilent(command: string): Promise<string>;
	abstract executeCommand(command: string, options: ExecuteOptions): Promise<boolean>;
}

export class PowerShellWrapper extends TerminalWrapper {
	private readonly setEncodingUtf8 = '$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding;';
	private readonly tempFilePath = '$tempPath = [System.IO.Path]::GetTempPath();$outputFile = Join-Path -Path $tempPath -ChildPath "outputCommandResult.txt";';
	private readonly executeResultFilePath: string;
	private readonly executeLogFilePath: string;
	private readonly terminalName: string;

	private errorOutputToSuccessOutputCommand: string = '';

	constructor() {
		super();
		this.executeLogFilePath = Logger.getExecuteLogFilePath();
		this.executeResultFilePath = Logger.getExecuteResultFileName();
		this.terminalName = Logger.terminalName;
	}

	public async executeSilent(command: string): Promise<string>{
		return new Promise<string>((resolve, reject) => {
			cp.exec(command, (err, out) => {
				if (err) {
					return reject(err);
				}
				return resolve(out);
			});
		});
	} 

	public async executeCommand(command: string, options: ExecuteOptions): Promise<boolean> {
		let terminal = vscode.window.terminals.find(i => i.name === this.terminalName);
		if (!terminal) {
			terminal = vscode.window.createTerminal({
				name: this.terminalName,
				location: vscode.TerminalLocation.Panel,
			});
		}

		if(!options.useErrorOutputToSuccessOutput){
			this.errorOutputToSuccessOutputCommand = '';
		}else{
			this.errorOutputToSuccessOutputCommand = '2>&1 ';
		}
		
		terminal.show(true);
		terminal.sendText(`${this.tempFilePath}`, false);
		terminal.sendText(`$share = ${this.setEncodingUtf8}`, false);
		terminal.sendText(`${command} ${this.errorOutputToSuccessOutputCommand} | `, false);
		terminal.sendText(`ForEach-Object { Write-Output $_; $_ | Tee-Object -file $outputFile | `, false);
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