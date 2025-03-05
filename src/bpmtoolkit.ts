import * as vscode from 'vscode';
import { FileManager } from './managers/filemanager';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { UtilityManagersFactory } from './factory/utilityManagersFactory';
import { BaseWebAppManager } from './abstractions/baseWebAppManager';
import { EmptyWebAppManager } from './implements/emptyWebAppManager';

export class BpmToolkit {
    private static instance: BpmToolkit;

    private _fileManager: FileManager;
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _webAppManager!: BaseWebAppManager;

    private _selectedUtilityStatus: vscode.StatusBarItem;
    private _selectedUtility: string;
  
    private constructor() {
        this._selectedUtility = '';
        this._selectedUtilityStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._selectedUtilityStatus.show();
        this._fileManager = new FileManager();
        this._fileManager.createTempDir();
        this.initializeUtilityManagers();
        vscode.workspace.onDidChangeConfiguration(async event => {
            if(event.affectsConfiguration('bpmtoolkit.general.utility')){
                await this.initializeUtilityManagers();
            }
        });
    }

    public static get Instance(): BpmToolkit {
        if (!BpmToolkit.instance) {
          BpmToolkit.instance = new BpmToolkit();
        }
    
        return BpmToolkit.instance;
    }

    public get fileManager(): FileManager{
        return this._fileManager;
    }

    public get packageDeploymentManager(): PackageDeploymentManager{
        return this._packageDeploymentManager;
    }

    public get webAppManager(): BaseWebAppManager{
        return this._webAppManager;
    }

    public async initializeUtilityManagers() {
        const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
        const utilityName = generalConfig.get<string>('utility')!;
        
        if(this._selectedUtility !== utilityName){
            this._selectedUtilityStatus.text = `Selected utility: ${utilityName}`;
            this._webAppManager = await UtilityManagersFactory.createWebAppManager(utilityName);
            this._packageDeploymentManager = UtilityManagersFactory.createPackageDeploymentManager(utilityName);
            this._selectedUtility = utilityName;

            if(this._webAppManager instanceof EmptyWebAppManager){
                this._selectedUtilityStatus.text += ' (not installed)';
            }
        }
    }
  }