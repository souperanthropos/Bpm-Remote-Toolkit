import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor } from '../../interfaces';
import { ExtensionSettings } from '../../constants';

export class clioPackageCommandExecutor implements IPackageCommandExecutor {
    private terminal: TerminalWrapper;

    constructor(private terminalLog: vscode.OutputChannel) {
        this.terminal = new TerminalWrapper(ExtensionSettings.extensionPath, ExtensionSettings.terminalName);
    }

    public async createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean> {
        return await this.terminal.executeCommand(
            "clio generate-pkg-zip "
            + targetFolderPath + " -d "
            + fullPathFile,
            true
        );
    }

    public async pushPackage(packageFilePath: string, targetEnviroment: string): Promise<boolean> {
        return await this.terminal.executeCommand(
            'clio push-pkg '
            + packageFilePath
            + ' -e ' + targetEnviroment,
            true
        );
    }
}