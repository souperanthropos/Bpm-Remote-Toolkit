import * as vscode from 'vscode';
import { TerminalWrapper } from '../../terminal/terminalwrapper';
import { IPackageCommandExecutor } from '../../interfaces';
import { ExtensionSettings } from '../../constants';

export class UbsPackageCommandExecutor implements IPackageCommandExecutor {
    private terminal: TerminalWrapper;

    constructor(private terminalLog: vscode.OutputChannel) {
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

    public async pushPackage(packageFilePath: string, targetEnviroment: string): Promise<boolean> {
        return await this.terminal.executeCommand(
            'ubs push '
            + packageFilePath
            + ' -e ' + targetEnviroment,
            false
        );
    }
}