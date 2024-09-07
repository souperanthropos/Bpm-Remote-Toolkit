import * as vscode from 'vscode';
import { packageSettings } from '../interfaces';
import { TerminalWrapper } from '../terminal/terminalwrapper';
import { IPackageCommandExecutor } from '../interfaces';
import { ExtensionSettings, getDirectoryName, Logger } from '../constants';

export class PackageManager {
    private terminal: TerminalWrapper;

    public onCommandExecuteError?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean, outputPathLog: string | undefined) => void;

    constructor(private wrapper: IPackageCommandExecutor) {
        this.terminal = new TerminalWrapper(ExtensionSettings.extensionPath, ExtensionSettings.terminalName);
    }

    public async createPackage(targetFolderPath: string): Promise<boolean> {
        const path = require("path");
        const fullPathFile = path.join(ExtensionSettings.outputPath, getDirectoryName(targetFolderPath) + '.gz');

        const result = await this.wrapper.createPackage(targetFolderPath, fullPathFile);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true, this.terminal.executeLogFilePath);
        }

        return result;
    }

    public async pushPackage(settings: packageSettings) {
        const path = require("path");

        if (settings.targetEnviroment === undefined || settings.targetEnviroment === '') {
            Logger.writeToChannel('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false, undefined);
            }
            return;
        }

        const packageFilePath = path.join(ExtensionSettings.outputPath, getDirectoryName(settings.targetFolderPath) + ".gz");

        const result = await this.wrapper.pushPackage(packageFilePath, settings.targetEnviroment);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true, this.terminal.executeLogFilePath);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true, this.terminal.executeLogFilePath);
        }
    }
}