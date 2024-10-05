import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor, packageSettings } from '../../interfaces';
import { FolderType, getDirectoryName } from '../../constants';
import { ExtensionSettings } from '../../common/extensionSettings';

export class UbsPackageCommandExecutor implements IPackageCommandExecutor {
    
    constructor(private terminal: TerminalWrapper) {}

    public async createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean> {
        await this.terminal.addTextToLogFile('Start package creating...');
        await this.terminal.executeCommand('del ' + fullPathFile);
        return await this.terminal.executeCommand(
            "ubs zip "
            + targetFolderPath + " -d "
            + fullPathFile
        );
    }

    public async pushPackage(pkg: packageSettings): Promise<boolean> {
        const path = require("path");
        const packageFilePath = path.join(ExtensionSettings.outputPath(FolderType.package), getDirectoryName(pkg.targetFolderPath) + ".gz");
        await this.terminal.addTextToLogFile('Start package uploading...');
        return await this.terminal.executeCommand(
            'ubs push '
            + packageFilePath
            + ' -e ' + pkg.targetEnviroment?.id
        );
    }
}