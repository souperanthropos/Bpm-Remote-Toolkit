import * as vscode from 'vscode';
import { FileManager } from './managers/filemanager';
import { PackageExplorer } from './packageExplorer';
import { ClioCommandExecutor } from './implements/clio/clioCommandExecutor';
import { ClioPackageCommandExecutor } from './implements/clio/clioPackageCommandExecutor';
import { UbsCommandExecutor } from './implements/ubs/ubsCommandExecutor';
import { UbsPackageCommandExecutor } from './implements/ubs/ubsPackageCommandExecutor';
import { WebAppManager } from './managers/webappmanager';
import { ExtensionSettings, showErrorMessage } from './constants';
import { serverSettings } from './interfaces';
import { QueuePackagesManager } from './managers/queuePackagesManager';

export class BpmToolkit {
    private _fileManager: FileManager;
    private _queuePackagesManager: QueuePackagesManager;
    private _packageExplorer!: PackageExplorer;
    private _webAppManager!: WebAppManager;
    private _selectedUtility: string;

    public get fileManager(): FileManager{
        return this._fileManager;
    }

    public get queuePackagesManager(): QueuePackagesManager{
        return this._queuePackagesManager;
    }

    public get packageExplorer(): PackageExplorer{
        return this._packageExplorer;
    }

    public get webAppManager(): WebAppManager{
        return this._webAppManager;
    }

    constructor() {
        this._selectedUtility = '';
        this._fileManager = new FileManager();
        this._queuePackagesManager = new QueuePackagesManager();
        this.checkWorkspaceSettings();
    }

    public checkWorkspaceSettings() {
        const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
    
        const utilityName = generalConfig.get<string>('utility')!;
        if(this._selectedUtility !== utilityName){
            switch(utilityName){
                case `clio`:
                    this._packageExplorer = new PackageExplorer(new ClioPackageCommandExecutor());
                    this._webAppManager = new WebAppManager(new ClioCommandExecutor());
                    break;
                case `ubs`:
                default:
                    this._packageExplorer = new PackageExplorer(new UbsPackageCommandExecutor());
                    this._webAppManager = new WebAppManager(new UbsCommandExecutor());
            }
            this._webAppManager.onCommandExecuteError = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) =>
                showErrorMessage(message, showbutton, executeLogFilePath);
            this._selectedUtility = utilityName;
        }
    
        ExtensionSettings.autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
        ExtensionSettings.outputPath = generalConfig.get<string>('outputPath')!;
    
        const serverConfig = vscode.workspace.getConfiguration('bpmtoolkit');
        ExtensionSettings.environments = serverConfig.get<serverSettings[]>('environments');
    
        if (ExtensionSettings.environments && ExtensionSettings.environments.length > 0) {
            vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
        } else {
            vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
        }
    
        vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
        vscode.commands.executeCommand('packagesExplorer.refreshEntry');
    }
}