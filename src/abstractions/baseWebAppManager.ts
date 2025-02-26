import { Logger } from "../common/logger";
import { showErrorMessage } from "../constants";
import { enviromentSettings } from "../interfaces";
import { FileManager } from "../managers/filemanager";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BaseWebAppManager {
    protected readonly _fileManager: FileManager;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(protected terminal: TerminalWrapper) {
        this._fileManager = new FileManager();
    }

    protected commandExecuteError(message: string): void {
        showErrorMessage(message, true, Logger.getExecuteLogFilePath());
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