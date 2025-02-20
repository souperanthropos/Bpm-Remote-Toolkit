import * as vscode from 'vscode';
import { BaseWebAppManager } from "../../abstractions/baseWebAppManager";
import { 
    ClioClearRedisDbCommand, 
    ClioCompileConfigurationCommand, 
    ClioOpenSettingsCommand, 
    ClioWebAppPingCommand, 
    ClioWebAppRegisterCommand, 
    ClioWebAppRestartCommand, 
    ClioWebAppUnRegisterCommand 
} from "../../command/clioCommands";
import { enviromentSettings } from "../../interfaces";

export class ClioWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        const command = new ClioOpenSettingsCommand(this.terminal);
        command.execute();
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        const command = new ClioWebAppRegisterCommand(this.terminal, server);
        return await command.execute();
    }

    public override async webAppUnregister(server: enviromentSettings, isLogEnabled: boolean) {
        const command = new ClioWebAppUnRegisterCommand(this.terminal, server);
        const result = await command.execute();
        if (isLogEnabled && !result) {
            this.commandExecuteError('Unregister web app failed.');
        }
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        const command = new ClioWebAppPingCommand(this.terminal, server);
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
            const command = new ClioWebAppRestartCommand(this.terminal, server);
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
            const command = new ClioClearRedisDbCommand(this.terminal, server);
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
            const command = new ClioCompileConfigurationCommand(this.terminal, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Compile configuration failed.');
            }
        }
    }
}