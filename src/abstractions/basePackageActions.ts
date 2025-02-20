import { packageSettings } from "../interfaces";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BasePackageActions {

    constructor(protected terminal: TerminalWrapper) {}

    public abstract createPackage(pkg: packageSettings): Promise<boolean>;
	public abstract pushPackage(pkg: packageSettings): Promise<boolean>;
}