import * as vscode from 'vscode';
import { IWrapperCommandExecutor, enviromentSettings } from '../interfaces';

export class WebAppManager {
    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private wrapper: IWrapperCommandExecutor) { }

    public openSettings() {
        this.wrapper.openSettings();
    }

    public async webAppRegister(server: enviromentSettings): Promise<boolean> {
        return await this.wrapper.webAppRegister(server);
    }

    public async webAppUnregister(server: enviromentSettings, isLogEnabled: boolean) {
        const result = await this.wrapper.webAppUnregister(server);
        if (isLogEnabled) {
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Unregister web app failed.', true);
            }
        }
    }

    public async webAppPing(server: enviromentSettings): Promise<boolean> {
        const result = await this.wrapper.webAppPing(server);
        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Ping web app failed.', true);
        }
        return result;
    }

    public async webAppRestart(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            const result = await this.wrapper.webAppRestart(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Restart web app failed.', true);
            }
        }
    }

    public async clearRedisDb(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.wrapper.clearRedisDb(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Clear redis db failed.', true);
            }
        }
    }

    public async compileConfiguration(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                "You cannot execute this command because server " + server.id + " is disabled."
            );
        } else {
            const result = await this.wrapper.compileConfiguration(server);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true);
            }
        }
    }
}