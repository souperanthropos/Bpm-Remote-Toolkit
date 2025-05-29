import path from "path";
import { PackageSettings } from "../common/packageSettings";
import { PowerShellZipCommand } from "../command/winCommand";
import { ExtensionManager } from "../managers/extensionManager";
import { getDirectoryName } from "../constants";

export abstract class BasePackageActions {
    protected packageSettings?: PackageSettings;
    protected filesForZip: string[] = [];
    protected pushingFilePath: string = '';

    constructor(protected extensionManager: ExtensionManager) {}

    private async createZipFile(): Promise<boolean> {
        const sourcePath = path.join(this.extensionManager.packageDirPath, '*.gz');
        const generatedZipFileName = `${getDirectoryName(this.extensionManager.packageDirPath)}.zip`;
        this.pushingFilePath = path.join(this.extensionManager.packageDirPath, generatedZipFileName);
        const command = new PowerShellZipCommand(this.extensionManager.terminalWrapper, sourcePath, this.pushingFilePath);
        return await command.execute();
    }

    private cleanProperties(): void {
        this.filesForZip = [];
        this.packageSettings = undefined;
    }

    protected commandExecuteError(message: string): void {
        this.extensionManager.showErrorMessage(message, true);
    }

    protected abstract createGZFile(): Promise<boolean>;
    protected abstract internalPushPackage(enviromentId: string): Promise<boolean>;

    public async createPackage(pkg: PackageSettings, onlyCreatePackage: boolean): Promise<boolean> {
        this.packageSettings = pkg;
        const destinationFilePath = path.join(this.extensionManager.packageDirPath, pkg.packageFileName + '.gz');

        if(!onlyCreatePackage){
            this.filesForZip.push(destinationFilePath);
        }
        
        return await this.createGZFile();
    }

	public async pushPackage(enviromentId: string): Promise<boolean> {
        if(this.filesForZip.length === 0){
            this.commandExecuteError('The package file is not created.');
            return false;
        }

        let result = false;

        if(this.filesForZip.length > 1){
            result = await this.createZipFile();

            if(!result){
                return false;
            }
        }else{
            this.pushingFilePath = this.filesForZip.pop()!;
        }

        result = await this.internalPushPackage(enviromentId);

        this.cleanProperties();

        return result;
    }
}