import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileManager } from './managers/filemanager';
import { ClioCommandExecutor } from './implements/clio/clioCommandExecutor';
import { ClioPackageCommandExecutor } from './implements/clio/clioPackageCommandExecutor';
import { UbsCommandExecutor } from './implements/ubs/ubsCommandExecutor';
import { UbsPackageCommandExecutor } from './implements/ubs/ubsPackageCommandExecutor';
import { WebAppManager } from './managers/webappmanager';
import { FolderType, showErrorMessage } from './constants';
import { enviromentSettings } from './interfaces';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { PackageManager } from './managers/packagemanager';
import { PowerShellWrapper, TerminalWrapper } from './terminal/terminalwrapper';
import { ExtensionSettings } from './common/extensionSettings';
import { Logger } from './common/logger';

export class BpmToolkit {
    private _fileManager: FileManager;
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _webAppManager!: WebAppManager;
    private _packageManager!: PackageManager;

    private _selectedUtility: string;

    public get fileManager(): FileManager{
        return this._fileManager;
    }

    public get packageDeploymentManager(): PackageDeploymentManager{
        return this._packageDeploymentManager;
    }

    public get packageManager(): PackageManager{
        return this._packageManager;
    }

    public get webAppManager(): WebAppManager{
        return this._webAppManager;
    }

    constructor(extensionPath: string) {
        ExtensionSettings.extensionPath = extensionPath;
        this._selectedUtility = '';
        this._fileManager = new FileManager();
        this.createTempDir();
        this.checkWorkspaceSettings();
    }

    private createTempDir() {
        let dir = ExtensionSettings.outputPath(FolderType.default);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        dir = ExtensionSettings.outputPath(FolderType.package);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        dir = ExtensionSettings.outputPath(FolderType.terminal);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    public checkWorkspaceSettings() {
        const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
    
        const utilityName = generalConfig.get<string>('utility')!;
        if(this._selectedUtility !== utilityName){
            switch(utilityName){
                case `clio`:
                    this._packageManager = new PackageManager(new ClioPackageCommandExecutor(new PowerShellWrapper(false)));
                    this._webAppManager = new WebAppManager(new ClioCommandExecutor(new PowerShellWrapper(true)));
                    break;
                case `ubs`:
                default:
                    this._packageManager = new PackageManager(new UbsPackageCommandExecutor(new PowerShellWrapper(false)));
                    this._webAppManager = new WebAppManager(new UbsCommandExecutor(new PowerShellWrapper(true)));
            }
            this._packageDeploymentManager = new PackageDeploymentManager(this._packageManager);
            this._webAppManager.onCommandExecuteError = (message: string, showbutton: boolean) =>
                showErrorMessage(message, showbutton, Logger.getExecuteLogFilePath());
            this._selectedUtility = utilityName;
        }
    
        ExtensionSettings.autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
    
        const serverConfig = vscode.workspace.getConfiguration('bpmtoolkit');
        ExtensionSettings.environments = serverConfig.get<enviromentSettings[]>('environments');
    
        if (ExtensionSettings.environments && ExtensionSettings.environments.length > 0) {
            vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
        } else {
            vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
        }
    
        vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
        vscode.commands.executeCommand('packagesExplorer.refreshEntry');
    }
}