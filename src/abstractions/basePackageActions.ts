import path from "path";
import { PackageSettings } from "../common/packageSettings";
import { DataTimeUtility } from "../common/utilities/dataTimeUtility";
import { PowerShellZipCommand } from "../command/winCommand";
import { ExtensionManager } from "../managers/extensionManager";

export abstract class BasePackageActions {
    protected packageSettings?: PackageSettings;
    protected destinationFilePath?: string;

    constructor(protected extensionManager: ExtensionManager) {}

    private async createZipFile(): Promise<boolean> {
        const pkg = this.packageSettings!;
        const sourceFilePath = path.join(this.extensionManager.packageDirPath, pkg.packageFileName + '.gz');
        const generatedZipFileName = `${pkg.packageFileName}_${DataTimeUtility.formatDate(new Date(), '-_.')}.zip`;
        this.destinationFilePath = path.join(this.extensionManager.packageDirPath, generatedZipFileName);
        const command = new PowerShellZipCommand(this.extensionManager.terminalWrapper, sourceFilePath, this.destinationFilePath);
        return await command.execute();
    }

    private cleanProperties(): void {
        this.packageSettings = undefined;
        this.destinationFilePath = undefined;
    }

    protected commandExecuteError(message: string): void {
        this.extensionManager.showErrorMessage(message, true);
    }

    protected abstract createGZFile(): Promise<boolean>;
    protected abstract internalPushPackage(enviromentId: string): Promise<boolean>;

    public async createPackage(pkg: PackageSettings): Promise<boolean> {
        this.packageSettings = pkg;
        this.destinationFilePath = path.join(this.extensionManager.packageDirPath, pkg.packageFileName + '.gz');

        let result = await this.createGZFile();
        if(result && this.extensionManager.packToZip){
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