import { Logger } from "../common/logger";
import { PackageSettings } from "../common/packageSettings";
import { showErrorMessage } from "../constants";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BasePackageActions {

    constructor(protected terminal: TerminalWrapper) {}

    protected commandExecuteError(message: string): void {
        showErrorMessage(message, true, Logger.getExecuteLogFilePath());
    }

    public abstract createPackage(pkg: PackageSettings): Promise<boolean>;
	public abstract pushPackage(pkg: PackageSettings, enviromentId: string): Promise<boolean>;
}