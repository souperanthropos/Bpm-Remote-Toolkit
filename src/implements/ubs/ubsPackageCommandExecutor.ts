import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor, packageSettings } from '../../interfaces';
import { ExtensionSettings, getDirectoryName } from '../../constants';

export class UbsPackageCommandExecutor implements IPackageCommandExecutor {
    private terminal: TerminalWrapper;

    constructor() {
        this.terminal = new TerminalWrapper(ExtensionSettings.extensionPath, ExtensionSettings.terminalName);
    }

    public async createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean> {
        const result = await this.terminal.executeCommand('del ' + fullPathFile, true);
        return await this.terminal.executeCommand(
            "ubs zip "
            + targetFolderPath + " -d "
            + fullPathFile,
            result
        );
    }

    public async pushPackage(pkg: packageSettings): Promise<boolean> {
        const path = require("path");
        const packageFilePath = path.join(ExtensionSettings.outputPath, getDirectoryName(pkg.targetFolderPath) + ".gz");
        return await this.terminal.executeCommand(
            'ubs push '
            + packageFilePath
            + ' -e ' + pkg.targetEnviroment?.id,
            false
        );
    }
}