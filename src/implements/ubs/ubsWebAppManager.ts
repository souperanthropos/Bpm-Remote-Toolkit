import * as vscode from 'vscode';
import { BaseWebAppManager } from "../../abstractions/baseWebAppManager";
import { 
    UbsClearRedisDbCommand, 
    UbsCompileConfigurationCommand, 
    UbsOpenSettingsCommand, 
    UbsWebAppPingCommand, 
    UbsWebAppRegisterCommand, 
    UbsWebAppRestartCommand, 
    UbsWebAppUnRegisterCommand 
} from "../../command/ubsCommands";
import { enviromentSettings } from "../../interfaces";
import { Logger } from '../../common/logger';

export class UbsWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        const command = new UbsOpenSettingsCommand(this.terminal);
        command.execute();
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
        const command = new UbsWebAppRegisterCommand(this.terminal);
        return await command.execute();
    }

    public override async webAppUnregister(server: enviromentSettings) {
        const command = new UbsWebAppUnRegisterCommand(this.terminal);
        const result = await command.execute();
        if (!result) {
            this.commandExecuteError('Unregister web app failed.');
        }
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        const command = new UbsWebAppPingCommand(this.terminal);
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
            const command = new UbsWebAppRestartCommand(this.terminal, server);
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
            const command = new UbsClearRedisDbCommand(this.terminal, server);
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
            const command = new UbsCompileConfigurationCommand(this.terminal, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Compile configuration failed.');
            }
        }
    }
}