import * as vscode from 'vscode';
import { packageSettings } from '../interfaces';
import { TerminalWrapper } from '../terminal/terminalwrapper';
import { getDirectoryName } from '../constants';

export class PackageManager {
    private terminal: TerminalWrapper;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private terminalLog: vscode.OutputChannel) {
        this.terminal = new TerminalWrapper();
    }

    public async createPackage(targetFolderPath: string): Promise<boolean> {
        const path = require("path");
        const config = vscode.workspace.getConfiguration('clio');
        const outputPath = config.get('outputPath');
        const fullPathFile = path.join(outputPath, getDirectoryName(targetFolderPath) + '.gz');

        this.terminalLog.appendLine('del ' + fullPathFile);
        await this.terminal.callInInteractiveTerminal('del ' + fullPathFile);

        this.terminalLog.appendLine(
            'Execute: clio generate-pkg-zip '
            + targetFolderPath + ' -d '
            + fullPathFile
        );

        const result = await this.terminal.callInInteractiveTerminal(
            "clio generate-pkg-zip "
            + targetFolderPath + " -d "
            + fullPathFile
        );

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true);
        }

        return result;
    }

    public async pushPackage(settings: packageSettings) {
        const path = require("path");

        if (settings.targetEnviroment === undefined || settings.targetEnviroment === '') {
            this.terminalLog.appendLine('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false);
            }
            return;
        }

        const config = vscode.workspace.getConfiguration('clio');
        const outputPath = config.get('outputPath');
        const packageFilePath = path.join(outputPath, getDirectoryName(settings.targetFolderPath) + ".gz");

        const result = await this.terminal.callInInteractiveTerminal(
            '$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding \n' +
            'clio push-pkg '
            + packageFilePath
            + ' -e ' + settings.targetEnviroment
        );

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true);
        }
    }
}