import { Logger } from "../common/logger";
import { showErrorMessage } from "../constants";
import { packageSettings } from "../interfaces";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BasePackageActions {

    constructor(protected terminal: TerminalWrapper) {}

    protected commandExecuteError(message: string): void {
        showErrorMessage(message, true, Logger.getExecuteLogFilePath());
    }

    public abstract createPackage(pkg: packageSettings): Promise<boolean>;
	public abstract pushPackage(pkg: packageSettings): Promise<boolean>;
}