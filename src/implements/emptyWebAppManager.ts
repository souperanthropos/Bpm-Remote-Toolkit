import { BaseWebAppManager } from "../abstractions/baseWebAppManager";
import { enviromentSettings } from "../interfaces";

export class EmptyWebAppManager extends BaseWebAppManager{

    public override openSettings(): void {
        this.commandExecuteError('Utility is not installed.');
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        this.commandExecuteError('Utility is not installed.');
        throw new Error('Utility is not installed.');
    }

    public override async webAppUnregister(server: enviromentSettings) {
        this.commandExecuteError('Utility is not installed.');
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        this.commandExecuteError('Utility is not installed.');
        throw new Error('Utility is not installed.');
    }

    public override async webAppRestart(server: enviromentSettings) {
        this.commandExecuteError('Utility is not installed.');
    }

    public override async clearRedisDb(server: enviromentSettings) {
        this.commandExecuteError('Utility is not installed.');
    }

    public override async compileConfiguration(server: enviromentSettings) {
        this.commandExecuteError('Utility is not installed.');
    }
}