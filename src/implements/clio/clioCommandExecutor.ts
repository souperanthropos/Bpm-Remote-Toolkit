import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IIntegratedCommandExecutor, enviromentSettings } from '../../interfaces';
import { isNullOrWhitespace } from '../../constants';

export class ClioCommandExecutor implements IIntegratedCommandExecutor {

    constructor(private terminal: TerminalWrapper) {}

    public openSettings() {
        this.terminal.executeCommand('clio open-settings', true);
    }

    public async webAppRegister(server: enviromentSettings): Promise<boolean> {
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
                    `clio reg-web-app ${server.id} -u ${server.url} -l ${loginQuery} -p ${passwordQuery} -i ${server.isNetCore}`,
                    true
                );
            }
        }
        return false;
    }

    public async webAppUnregister(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`, true);
    }

    public async webAppPing(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`clio ping -e ${server.id}`, true);
    }

    public async webAppRestart(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`clio restart-web-app -e ${server.id}`, true);
    }

    public async clearRedisDb(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`clio clear-redis-db -e ${server.id}`, true);
    }

    public async compileConfiguration(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`clio compile-configuration -e ${server.id}`, true);
    }
}