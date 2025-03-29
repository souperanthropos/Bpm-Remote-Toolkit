import path from "path";
import { Logger } from "../common/logger";
import { PackageSettings } from "../common/packageSettings";
import { showErrorMessage } from "../constants";
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { DataTimeUtility } from "../common/utilities/dataTimeUtility";
import { PowerShellZipCommand } from "../command/winCommand";

export abstract class BasePackageActions {
    protected packageSettings?: PackageSettings;
    protected destinationFilePath?: string;

    constructor(protected terminal: TerminalWrapper) {}

    private async createZipFile(): Promise<boolean> {
        const pkg = this.packageSettings!;
        const generatedZipFileName = `${pkg.packageFileName}_${DataTimeUtility.formatDate(new Date(), '-_.')}.zip`;
        this.destinationFilePath = path.join(pkg.outputPath, generatedZipFileName);
        const command = new PowerShellZipCommand(pkg.outputPathPackageFile, this.destinationFilePath);
        return await command.execute();
    }

    private cleanProperties(): void {
        this.packageSettings = undefined;
        this.destinationFilePath = undefined;
    }

    protected commandExecuteError(message: string): void {
        showErrorMessage(message, true, Logger.getExecuteLogFilePath());
    }

    protected abstract createGZFile(): Promise<boolean>;
    protected abstract internalPushPackage(enviromentId: string): Promise<boolean>;

    public async createPackage(pkg: PackageSettings): Promise<boolean> {
        this.packageSettings = pkg;
        this.destinationFilePath = pkg.outputPathPackageFile;

        let result = await this.createGZFile();
        if(result && ExtensionSettings.packToZip){
            result = await this.createZipFile();
        }
        if(!result){
            this.destinationFilePath = undefined;
        }

        return result;
    }

	public async pushPackage(enviromentId: string): Promise<boolean> {
        if(!this.destinationFilePath){
            this.commandExecuteError('The package file is not created.');
            return false;
        }

        const result = await this.internalPushPackage(enviromentId);

        this.cleanProperties();

        return result;
    }
}