import * as vscode from 'vscode';
import { BaseWebAppManager } from "../../abstractions/baseWebAppManager";
import * as ubsCommands from "../../command/ubsCommands";
import { enviromentSettings } from "../../interfaces";

export class UbsWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        const command = new ubsCommands.UbsOpenSettingsCommand(this.extensionManager.terminalWrapper);
        command.execute();
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        await this.extensionManager.clearExecuteLogs();
        const command = new ubsCommands.UbsWebAppRegisterCommand(this.extensionManager.terminalWrapper, server);
        return await command.execute();
    }

    public override async webAppUnregister(server: enviromentSettings) {
        const command = new ubsCommands.UbsWebAppUnRegisterCommand(this.extensionManager.terminalWrapper, server);
        const result = await command.execute();
        if (!result) {
            this.commandExecuteError('Unregister web app failed.');
        }
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        const command = new ubsCommands.UbsWebAppPingCommand(this.extensionManager.terminalWrapper, server);
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
            const command = new ubsCommands.UbsWebAppRestartCommand(this.extensionManager.terminalWrapper, server);
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
            const command = new ubsCommands.UbsClearRedisDbCommand(this.extensionManager.terminalWrapper, server);
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
            const command = new ubsCommands.UbsCompileConfigurationCommand(this.extensionManager.terminalWrapper, server);
            const result = await command.execute();
            if(!result){
                this.commandExecuteError('Compile configuration failed.');
            }
        }
    }
}