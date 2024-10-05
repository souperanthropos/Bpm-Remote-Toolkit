import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { ICommandExecutor, enviromentSettings } from '../../interfaces';

export class UbsCommandExecutor implements ICommandExecutor {
    
    constructor(private terminal: TerminalWrapper) {}

    public openSettings() {
        this.terminal.executeCommand('ubs settings');
    }

    public async webAppRegister(server: enviromentSettings): Promise<boolean> {
        let yesPressed = false;
        await vscode.window
            .showInformationMessage('This command is not supported in the current version of the utility. You will need to manually add the server.', "Yes", "No")
            .then(answer => {
                if (answer === "Yes") {
                    this.terminal.executeCommand('ubs settings');
                    yesPressed = true;
                }
            });
        return yesPressed;
    }

    public async webAppUnregister(server: enviromentSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`);
        return true;
    }

    public async webAppPing(server: enviromentSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio ping -e ${server.id}`);
        return true;
    }

    public async webAppRestart(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs restart -e ${server.id}`);
    }

    public async clearRedisDb(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs clear-redis -e ${server.id}`);
    }

    public async compileConfiguration(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs compile -e ${server.id}`);
    }
}