import * as vscode from 'vscode';
import path from "path";
import { ExecuteOptions, TerminalWrapper } from "./terminalwrapper";

export class BashWrapper extends TerminalWrapper {
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

        if (!options.useErrorOutputToSuccessOutput) {
            this.errorOutputToSuccessOutputCommand = '';
        } else {
            this.errorOutputToSuccessOutputCommand = '2>&1';
        }

        terminal.show(true);
        terminal.sendText(
            `${command} ${this.errorOutputToSuccessOutputCommand} | tee ${this.tempFilePath} >> ${this.executeLogFilePath}`,
            false
        );
        terminal.sendText(
            `if [ $? -eq 0 ]; then echo 1 > ${this.executeResultFilePath}; else echo 0 > ${this.executeResultFilePath}; fi`,
            false
        );
        terminal.sendText("exit");

        return new Promise((resolve, reject) => {
            const disposeToken = vscode.window.onDidCloseTerminal(
                async (closedTerminal) => {
                    if (closedTerminal === terminal) {
                        disposeToken.dispose();
                        if (terminal.exitStatus !== undefined) {
                            const pathFile = vscode.Uri.file(this.executeResultFilePath);
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