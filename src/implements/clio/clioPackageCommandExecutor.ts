import path from 'path';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor, packageSettings } from '../../interfaces';
import { getDirectoryName, FolderType } from '../../constants';
import { ExtensionSettings } from '../../common/extensionSettings';

export class ClioPackageCommandExecutor implements IPackageCommandExecutor {
    
    constructor(private terminal: TerminalWrapper) {}

    public async createPackage(pkg: packageSettings): Promise<boolean> {
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        await this.terminal.executeCommand('del ' + outPathPackageFile);
        return await this.terminal.executeCommand(
            "clio generate-pkg-zip "
            + pkg.targetFolderPath + " -d "
            + outPathPackageFile
        );
    }

    public async pushPackage(pkg: packageSettings): Promise<boolean> {
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        return await this.terminal.executeCommand(
            'clio push-pkg '
            + outPathPackageFile
            + ' -e ' + pkg.targetEnviroment?.id
        );
    }
}