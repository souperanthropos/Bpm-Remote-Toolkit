import * as vscode from 'vscode';
import { packageSettings } from './interfaces';
import { TerminalManager } from './terminalmanager';
import { rejects } from 'assert';

//https://hackwild.com/article/event-handling-techniques/
//$share = clio generate-pkg-zip c:\Users\Superb\OneDrive\Desktop\src\ModernWay-Srv\OmnilineR1 -d C:\Windows\OmnilineR1.gz > c:\Users\Superb\OneDrive\Документы\Source\bpmsoft-creator-package\commandExecute.log
//if($?){"command succeeded"}else{"command failed"}

export class PackageManager {
    private terminal: TerminalManager;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private terminalLog: vscode.OutputChannel, 
        extensionPath: string) {
            this.terminal = new TerminalManager(extensionPath);
    }

    private getDirectoryName(localPath: string): string {
        const path = require("path");
        return path.basename(localPath);
    }

    public async createPackage(targetFolderPath: string): Promise<boolean> {
        const path = require("path");
        const config = vscode.workspace.getConfiguration('clio');
        const outputPath = config.get('outputPath');
        const fullPathFile = path.join(outputPath, this.getDirectoryName(targetFolderPath) + '.gz');

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

        const result = await this.terminal.callInInteractiveTerminal(
            '$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding \n' +
            'clio push-pkg '
            + path.join(outputPath, this.getDirectoryName(settings.targetFolderPath) + ".gz")
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