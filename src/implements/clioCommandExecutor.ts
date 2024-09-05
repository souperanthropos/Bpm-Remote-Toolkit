import * as vscode from 'vscode';
import { TerminalWrapper } from '../terminal/terminalwrapper';
import { IWebAppCommandExecutor, serverSettings } from '../interfaces';
import { Constants, isNullOrWhitespace } from '../constants';

export class ClioCommandExecutor implements IWebAppCommandExecutor {
    private terminal: TerminalWrapper;

    public onCommandExecuteError?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;

    constructor(private terminalLog: vscode.OutputChannel) {
        this.terminal = new TerminalWrapper(Constants.extensionPath, Constants.terminalName);
    }

    public getLastExecuteLogPath(): string {
        return this.terminal.executeLogFilePath;
    }

    public openSettings() {
        this.terminal.executeCommand('clio open-settings', false);
    }

    public async webAppRegister(server: serverSettings): Promise<boolean> {
        const loginQuery = await vscode.window.showInputBox({
            placeHolder: "Login",
            prompt: "Enter login for connecting to Bpmsoft"
        });
        if (!isNullOrWhitespace(loginQuery)) {
            const passwordQuery = await vscode.window.showInputBox({
                placeHolder: "Password",
                prompt: "Enter password for connecting to Bpmsoft",
                password: true
            });
            if (!isNullOrWhitespace(passwordQuery)) {
                return await this.terminal.executeCommand(
                    `clio reg-web-app ${server.id} -u ${server.url} -l ${loginQuery} -p ${passwordQuery}`,
                    true
                );
            }
        }
        return false;
    }

    public async webAppUnregister(server: serverSettings, isLogEnabled: boolean) {
        if(isLogEnabled){
            const result = await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`, true);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Unregister web app failed.', true, this.terminal.executeLogFilePath);
            }
        }else{
            await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`, false);
        }
    }

    public async webAppPing(server: serverSettings): Promise<boolean> {
        const result = await this.terminal.executeCommand(`clio ping ${server.id}`, true);
        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Ping web app failed.', true, this.terminal.executeLogFilePath);
        }
        return result;
    }

    public async webAppRestart(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            const result = await this.terminal.executeCommand(`clio restart-web-app ${server.id}`, true);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Restart web app failed.', true, this.terminal.executeLogFilePath);
            }
        }
    }

    public async clearRedisDb(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.terminal.executeCommand(`clio clear-redis-db ${server.id}`, true);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Clear redis db failed.', true, this.terminal.executeLogFilePath);
            }
        }
    }

    public async compileConfiguration(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.terminal.executeCommand(`clio compile-configuration ${server.id}`, true);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true, this.terminal.executeLogFilePath);
            }
        }
    }
}