import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IWrapperCommandExecutor, serverSettings } from '../../interfaces';
import { ExtensionSettings, isNullOrWhitespace } from '../../constants';

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

    public async webAppRegister(server: serverSettings): Promise<boolean> {
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

    public async webAppUnregister(server: serverSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio unreg-web-app ${server.id}`, true);
        return true;
    }

    public async webAppPing(server: serverSettings): Promise<boolean> {
        //return await this.terminal.executeCommand(`clio ping -e ${server.id}`, true);
        return true;
    }

    public async webAppRestart(server: serverSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs restart -e ${server.id}`, true);
    }

    public async clearRedisDb(server: serverSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs clear-redis -e ${server.id}`, true);
    }

    public async compileConfiguration(server: serverSettings): Promise<boolean> {
        return await this.terminal.executeCommand(`ubs compile -e ${server.id}`, true);
    }
}