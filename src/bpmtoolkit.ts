import * as vscode from 'vscode';
import { FileManager } from './managers/filemanager';
import { PackageExplorer } from './packageExplorer';
import { ClioCommandExecutor } from './implements/clio/clioCommandExecutor';
import { ClioPackageCommandExecutor } from './implements/clio/clioPackageCommandExecutor';
import { UbsCommandExecutor } from './implements/ubs/ubsCommandExecutor';
import { UbsPackageCommandExecutor } from './implements/ubs/ubsPackageCommandExecutor';
import { WebAppManager } from './managers/webappmanager';
import { ExtensionSettings, Logger, showErrorMessage, showInformationMessage } from './constants';
import { enviromentSettings } from './interfaces';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { PackageManager } from './managers/packagemanager';
import { TerminalWrapper } from './terminal/terminalwrapper';

export class BpmToolkit {
    private _logger: Logger;
    private _terminalWrapper: TerminalWrapper;
    private _fileManager: FileManager;
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _packageExplorer!: PackageExplorer;
    private _webAppManager!: WebAppManager;

    private _packageManager!: PackageManager;
    private _selectedUtility: string;

    public get fileManager(): FileManager{
        return this._fileManager;
    }

    public get packageDeploymentManager(): PackageDeploymentManager{
        return this._packageDeploymentManager;
    }

    public get packageExplorer(): PackageExplorer{
        return this._packageExplorer;
    }

    public get webAppManager(): WebAppManager{
        return this._webAppManager;
    }

    constructor() {
        this._selectedUtility = '';
        this._logger = new Logger();
        this._terminalWrapper = new TerminalWrapper(this._logger);
        this._fileManager = new FileManager();
        this.checkWorkspaceSettings();
    }

    public getLastExecuteLogPath(): string {
        return this._terminalWrapper.executeLogFilePath;
    }

    public checkWorkspaceSettings() {
        const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
    
        const utilityName = generalConfig.get<string>('utility')!;
        if(this._selectedUtility !== utilityName){
            switch(utilityName){
                case `clio`:
                    this._packageManager = new PackageManager(new ClioPackageCommandExecutor(this._terminalWrapper));
                    this._webAppManager = new WebAppManager(new ClioCommandExecutor(this._terminalWrapper));
                    break;
                case `ubs`:
                default:
                    this._packageManager = new PackageManager(new UbsPackageCommandExecutor(this._terminalWrapper));
                    this._webAppManager = new WebAppManager(new UbsCommandExecutor(this._terminalWrapper));
            }
            this._packageDeploymentManager = new PackageDeploymentManager(this._packageManager);
            this._packageExplorer = new PackageExplorer(this._packageManager);
            this._packageManager.onCommandExecuteError = (message: string, showbutton: boolean) =>
                showErrorMessage(message, showbutton, this._terminalWrapper.executeLogFilePath);
            this._packageManager.onCommandExecuteComplete = (message: string, showbutton: boolean) =>
                showInformationMessage(message, showbutton, this._terminalWrapper.executeLogFilePath);
            this._webAppManager.onCommandExecuteError = (message: string, showbutton: boolean) =>
                showErrorMessage(message, showbutton, this._terminalWrapper.executeLogFilePath);
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