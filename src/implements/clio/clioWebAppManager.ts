import * as vscode from 'vscode';
import { BaseWebAppManager } from "../../abstractions/baseWebAppManager";
import * as clioCommands from "../../command/clioCommands";
import { enviromentSettings } from "../../interfaces";

export class ClioWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        const command = new clioCommands.ClioOpenSettingsCommand(this.extensionManager.terminalWrapper);
        command.execute();
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        await this.extensionManager.clearExecuteLogs();
        const command = new clioCommands.ClioWebAppRegisterCommand(this.extensionManager.terminalWrapper, server);
        return await command.execute();
    }

    public override async webAppUnregister(server: enviromentSettings) {
        const command = new clioCommands.ClioWebAppUnRegisterCommand(this.extensionManager.terminalWrapper, server);
        const result = await command.execute();
        if (!result) {
            this.commandExecuteError('Unregister web app failed.');
        }
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        const command = new clioCommands.ClioWebAppPingCommand(this.extensionManager.terminalWrapper, server);
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
            await this.extensionManager.clearExecuteLogs();
            const command = new clioCommands.ClioWebAppRestartCommand(this.extensionManager.terminalWrapper, server);
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
            await this.extensionManager.clearExecuteLogs();
            const command = new clioCommands.ClioClearRedisDbCommand(this.extensionManager.terminalWrapper, server);
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
            await this.extensionManager.clearExecuteLogs();
            const command = new clioCommands.ClioCompileConfigurationCommand(this.extensionManager.terminalWrapper, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Compile configuration failed.');
            }
        }
    }
}