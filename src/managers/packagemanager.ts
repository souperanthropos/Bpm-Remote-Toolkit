import { packageSettings } from '../interfaces';
import { IPackageCommandExecutor } from '../interfaces';
import { ExtensionSettings, FolderType, getDirectoryName, Logger } from '../constants';

export class PackageManager {

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private wrapper: IPackageCommandExecutor) {}

    public async createPackage(targetFolderPath: string): Promise<boolean> {
        const path = require("path");
        const fullPathFile = path.join(ExtensionSettings.outputPath(FolderType.package), getDirectoryName(targetFolderPath) + '.gz');

        const result = await this.wrapper.createPackage(targetFolderPath, fullPathFile);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true);
        }

        return result;
    }

    public async pushPackage(settings: packageSettings): Promise<boolean>  {
        if (settings.targetEnviroment === null) {
            Logger.writeToChannel('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false);
            }
            return false;
        }

        const result = await this.wrapper.pushPackage(settings);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true);
        }

        return result;
    }
}