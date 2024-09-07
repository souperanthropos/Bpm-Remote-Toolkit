import * as vscode from 'vscode';
import { IWrapperCommandExecutor, serverSettings } from '../interfaces';

export class WebAppManager {
    public onCommandExecuteError?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;

    constructor(private terminalLog: vscode.OutputChannel,
        private wrapper: IWrapperCommandExecutor) { }

    public openSettings() {
        this.wrapper.openSettings();
    }

    public getLastExecuteLogPath(): string {
        return this.wrapper.getLastExecuteLogPath();
    }

    public async webAppRegister(server: serverSettings): Promise<boolean> {
        return await this.wrapper.webAppRegister(server);
    }

    public async webAppUnregister(server: serverSettings, isLogEnabled: boolean) {
        const result = await this.wrapper.webAppUnregister(server);
        if (isLogEnabled) {
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Unregister web app failed.', true, this.wrapper.getLastExecuteLogPath());
            }
        }
    }

    public async webAppPing(server: serverSettings): Promise<boolean> {
        const result = await this.wrapper.webAppPing(server);
        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Ping web app failed.', true, this.wrapper.getLastExecuteLogPath());
        }
        return result;
    }

    public async webAppRestart(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            const result = await this.wrapper.webAppRestart(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Restart web app failed.', true, this.wrapper.getLastExecuteLogPath());
            }
        }
    }

    public async clearRedisDb(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.wrapper.clearRedisDb(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Clear redis db failed.', true, this.wrapper.getLastExecuteLogPath());
            }
        }
    }

    public async compileConfiguration(server: serverSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.wrapper.compileConfiguration(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true, this.wrapper.getLastExecuteLogPath());
            }
        }
    }
}