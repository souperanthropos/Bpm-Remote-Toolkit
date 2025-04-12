import { enviromentSettings } from "../interfaces";
import { ExtensionManager } from "../managers/extensionManager";

export abstract class BaseWebAppManager {

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(protected extensionManager: ExtensionManager) {}

    protected commandExecuteError(message: string): void {
        this.extensionManager.showErrorMessage(message, true);
        if (this.onCommandExecuteError) {
            this.onCommandExecuteError(message, true);
        }
    }

    public abstract openSettings(): void;
    public abstract webAppRegister(server: enviromentSettings): Promise<boolean>;
    public abstract webAppUnregister(server: enviromentSettings): void;
    public abstract webAppPing(server: enviromentSettings): Promise<boolean>;
    public abstract webAppRestart(server: enviromentSettings): void;
    public abstract clearRedisDb(server: enviromentSettings): void;
    public abstract compileConfiguration(server: enviromentSettings): void;
}