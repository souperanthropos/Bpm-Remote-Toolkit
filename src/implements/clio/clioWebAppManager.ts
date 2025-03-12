import * as vscode from 'vscode';
import { BaseWebAppManager } from "../../abstractions/baseWebAppManager";
import * as clioCommands from "../../command/clioCommands";
import { enviromentSettings } from "../../interfaces";
import { Logger } from '../../common/logger';

export class ClioWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        const command = new clioCommands.ClioOpenSettingsCommand(this.terminal);
        command.execute();
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
        const command = new clioCommands.ClioWebAppRegisterCommand(this.terminal, server);
        return await command.execute();
    }

    public override async webAppUnregister(server: enviromentSettings) {
        const command = new clioCommands.ClioWebAppUnRegisterCommand(this.terminal, server);
        const result = await command.execute();
        if (!result) {
            this.commandExecuteError('Unregister web app failed.');
        }
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        const command = new clioCommands.ClioWebAppPingCommand(this.terminal, server);
        const result = await command.execute();
        if(!result){
            this.commandExecuteError('Ping web app failed.');
        }
        return result;
    }

    public override async webAppRestart(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
            const command = new clioCommands.ClioWebAppRestartCommand(this.terminal, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Restart web app failed.');
            }
        }
    }

    public override async clearRedisDb(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
            const command = new clioCommands.ClioClearRedisDbCommand(this.terminal, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Clear redis db failed.');
            }
        }
    }

    public override async compileConfiguration(server: enviromentSettings) {
        if (!server.isEnable) {
            vscode.window.showInformationMessage(
                `You cannot execute this command because server ${server.id} is disabled.`
            );
        } else {
            await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
            const command = new clioCommands.ClioCompileConfigurationCommand(this.terminal, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Compile configuration failed.');
            }
        }
    }
}