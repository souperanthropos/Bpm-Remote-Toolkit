import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor } from '../../interfaces';
import { ExtensionSettings } from '../../constants';

export class ClioPackageCommandExecutor implements IPackageCommandExecutor {
    private terminal: TerminalWrapper;

    constructor() {
        this.terminal = new TerminalWrapper(ExtensionSettings.extensionPath, ExtensionSettings.terminalName);
    }

    public async createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean> {
        const result = await this.terminal.executeCommand('del ' + fullPathFile, true);
        return await this.terminal.executeCommand(
            "clio generate-pkg-zip "
            + targetFolderPath + " -d "
            + fullPathFile,
            result
        );
    }

    public async pushPackage(packageFilePath: string, targetEnviroment: string): Promise<boolean> {
        return await this.terminal.executeCommand(
            'clio push-pkg '
            + packageFilePath
            + ' -e ' + targetEnviroment,
            false
        );
    }
}