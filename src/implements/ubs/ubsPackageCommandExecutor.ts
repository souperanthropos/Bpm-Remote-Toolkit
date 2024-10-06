import path from 'path';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor, packageSettings } from '../../interfaces';
import { FolderType, getDirectoryName } from '../../constants';
import { ExtensionSettings } from '../../common/extensionSettings';

export class UbsPackageCommandExecutor implements IPackageCommandExecutor {
    
    constructor(private terminal: TerminalWrapper) {}

    public async createPackage(pkg: packageSettings): Promise<boolean> {
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        await this.terminal.addTextToLogFile(`Start package creating ${packageFileName} for ${pkg.targetEnviroment?.id}.`);
        await this.terminal.executeCommand('del ' + outPathPackageFile);
        return await this.terminal.executeCommand(
            "ubs zip "
            + pkg.targetFolderPath + " -d "
            + outPathPackageFile
        );
    }

    public async pushPackage(pkg: packageSettings): Promise<boolean> {
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        await this.terminal.addTextToLogFile(`Start package uploading ${packageFileName} in ${pkg.targetEnviroment?.id}.`);
        return await this.terminal.executeCommand(
            'ubs push '
            + outPathPackageFile
            + ' -e ' + pkg.targetEnviroment?.id
        );
    }
}