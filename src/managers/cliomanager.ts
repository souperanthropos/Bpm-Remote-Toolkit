import * as vscode from 'vscode';
import { TerminalWrapper } from '../terminal/terminalwrapper';
import { serverSettings } from '../interfaces';
import { isNullOrWhitespace } from '../constants';

export class ClioManager {
    private terminal: TerminalWrapper;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private terminalLog: vscode.OutputChannel) {
        this.terminal = new TerminalWrapper();
    }

    public OpenSettings() {
        this.terminal.callInInteractiveTerminalWithoutLog('clio open-settings');
    }

    public async WebAppRegister(server: serverSettings): Promise<boolean> {
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
                return await this.terminal.callInInteractiveTerminal(
                    `clio reg-web-app ${server.id} -u ${server.url} -l ${loginQuery} -p ${passwordQuery}`
                );
            }
        }
        return false;
    }

    public async WebAppUnregister(server: serverSettings, isLogEnabled: boolean) {
        if(isLogEnabled){
            const result = await this.terminal.callInInteractiveTerminal(`clio unreg-web-app ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Unregister web app failed.', true);
            }
        }else{
            await this.terminal.callInInteractiveTerminalWithoutLog(`clio unreg-web-app ${server.id}`);
        }
    }

    public async WebAppPing(server: serverSettings): Promise<boolean> {
        const result = await this.terminal.callInInteractiveTerminal(`clio ping ${server.id}`);
        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Ping web app failed.', true);
        }
        return result;
    }

    public async WebAppRestart(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            const result = await this.terminal.callInInteractiveTerminal(`clio restart-web-app ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Restart web app failed.', true);
            }
        }
    }

    public async ClearRedisDb(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.terminal.callInInteractiveTerminal(`clio clear-redis-db ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Clear redis db failed.', true);
            }
        }
    }

    public async CompileConfiguration(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.terminal.callInInteractiveTerminal(`clio compile-configuration ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true);
            }
        }
    }
}