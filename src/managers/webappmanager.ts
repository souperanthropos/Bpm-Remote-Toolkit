import * as vscode from 'vscode';
import { ICommandExecutor, enviromentSettings } from '../interfaces';
import { Logger } from '../common/logger';
import { showErrorMessage } from '../constants';

export class WebAppManager {
    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private commandExecutor: ICommandExecutor) { }

    public openSettings() {
        this.commandExecutor.openSettings();
    }

    public async webAppRegister(server: enviromentSettings): Promise<boolean> {
        return await this.commandExecutor.webAppRegister(server);
    }

    public async webAppUnregister(server: enviromentSettings, isLogEnabled: boolean) {
        const result = await this.commandExecutor.webAppUnregister(server);
        if (isLogEnabled) {
            showErrorMessage('Unregister web app failed.', true, Logger.getExecuteLogFilePath());
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Unregister web app failed.', true);
            }
        }
    }

    public async webAppPing(server: enviromentSettings): Promise<boolean> {
        const result = await this.commandExecutor.webAppPing(server);
        showErrorMessage('Ping web app failed.', true, Logger.getExecuteLogFilePath());
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
            const result = await this.commandExecutor.webAppRestart(server);
            showErrorMessage('Restart web app failed.', true, Logger.getExecuteLogFilePath());
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
            const result = await this.commandExecutor.clearRedisDb(server);
            showErrorMessage('Clear redis db failed.', true, Logger.getExecuteLogFilePath());
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
            const result = await this.commandExecutor.compileConfiguration(server);
            showErrorMessage('Compile configuration failed.', true, Logger.getExecuteLogFilePath());
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true);
            }
        }
    }
}