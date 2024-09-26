import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor, packageSettings } from '../../interfaces';
import { ExtensionSettings, getDirectoryName } from '../../constants';

export class ClioPackageCommandExecutor implements IPackageCommandExecutor {
    
    constructor(private terminal: TerminalWrapper) {}

    public async createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean> {
        const result = await this.terminal.executeCommand('del ' + fullPathFile, true);
        return await this.terminal.executeCommand(
            "clio generate-pkg-zip "
            + targetFolderPath + " -d "
            + fullPathFile,
            result
        );
    }

    public async pushPackage(pkg: packageSettings): Promise<boolean> {
        const path = require("path");
        const packageFilePath = path.join(ExtensionSettings.outputPath(), getDirectoryName(pkg.targetFolderPath) + ".gz");
        return await this.terminal.executeCommand(
            'clio push-pkg '
            + packageFilePath
            + ' -e ' + pkg.targetEnviroment?.id,
            false
        );
    }
}