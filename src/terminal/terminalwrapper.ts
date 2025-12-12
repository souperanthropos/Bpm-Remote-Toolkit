import * as vscode from 'vscode';
import * as cp from "child_process";
import path from 'path';

export type ExecuteOptions = { 
	useErrorOutputToSuccessOutput: boolean
};

export abstract class TerminalWrapper {
	private readonly executeLogFileName = 'commandExecute.log';
	private readonly _terminalName: string;
	
	protected readonly _executeLogFilePath: string;

	public get executeLogFilePath(): string {
		return this._executeLogFilePath;
	}

	constructor(rootDirPath: string, terminalName: string) {
		this._terminalName = terminalName;
		this._executeLogFilePath = path.join(rootDirPath, this.executeLogFileName);
	}

	protected getTerminal(): vscode.Terminal {
		let terminal = vscode.window.terminals.find(i => i.name === this._terminalName);
		if (!terminal) {
			terminal = vscode.window.createTerminal({
				name: this._terminalName,
				location: vscode.TerminalLocation.Panel,
			});
		}
		return terminal;
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

	abstract executeCommand(command: string, options: ExecuteOptions): Promise<boolean>;
}