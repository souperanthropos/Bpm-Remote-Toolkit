import { BaseWebAppManager } from "../abstractions/baseWebAppManager";
import { enviromentSettings } from "../interfaces";

export class EmptyWebAppManager extends BaseWebAppManager{

    private readonly _errorMessage: string = 'Utility is not installed.';

    public override openSettings(): void {
        this.commandExecuteError(this._errorMessage);
    }

    public override async webAppRegister(server: enviromentSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }

    public override async webAppUnregister(server: enviromentSettings) {
        this.commandExecuteError(this._errorMessage);
    }

    public override async webAppPing(server: enviromentSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }

    public override async webAppRestart(server: enviromentSettings) {
        this.commandExecuteError(this._errorMessage);
    }

    public override async clearRedisDb(server: enviromentSettings) {
        this.commandExecuteError(this._errorMessage);
    }

    public override async compileConfiguration(server: enviromentSettings) {
        this.commandExecuteError(this._errorMessage);
    }
}