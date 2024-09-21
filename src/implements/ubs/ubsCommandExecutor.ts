import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IWrapperCommandExecutor, enviromentSettings } from '../../interfaces';
import { ExtensionSettings } from '../../constants';

export class UbsCommandExecutor implements IWrapperCommandExecutor {
    private terminal: TerminalWrapper;

    constructor() {
        this.terminal = new TerminalWrapper(ExtensionSettings.extensionPath, ExtensionSettings.terminalName);
    }

    public openSettings() {
        this.terminal.executeCommand('ubs settings', true);
    }

    public getLastExecuteLogPath(): string {
        return this.terminal.executeLogFilePath;
    }

    public async webAppRegister(server: enviromentSettings): Promise<boolean> {
        await vscode.window
            .showInformationMessage('This command is not supported in the current version of the utility. You will need to manually add the server.', "Yes", "No")
            .then(answer => {
                if (answer === "Yes") {
                    this.terminal.executeCommand('ubs settings', true);
                    return true;
                }
            });
        return false;
    }

    public async webAppUnregister(server: enviromentSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`, true);
        return true;
    }

    public async webAppPing(server: enviromentSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio ping -e ${server.id}`, true);
        return true;
    }

    public async webAppRestart(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs restart -e ${server.id}`, true);
    }

    public async clearRedisDb(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs clear-redis -e ${server.id}`, true);
    }

    public async compileConfiguration(server: enviromentSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs compile -e ${server.id}`, true);
    }
}