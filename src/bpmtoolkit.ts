import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileManager } from './managers/filemanager';
import { WebAppManager } from './managers/webappmanager';
import { FolderType } from './constants';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { ExtensionSettings } from './common/extensionSettings';
import { UtilityManagersFactory } from './abstract-factory/utilityManagersFactory';

export class BpmToolkit {
    private static instance: BpmToolkit;

    private _fileManager: FileManager;
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _webAppManager!: WebAppManager;

    private _selectedUtility: string;
  
    private constructor() {
        this._selectedUtility = '';
        this._fileManager = new FileManager();
        this.createTempDir();
        this.initializeUtilityManagers();
        vscode.workspace.onDidChangeConfiguration(event => {
            this.initializeUtilityManagers();
        });
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

    public get webAppManager(): WebAppManager{
        return this._webAppManager;
    }

    public initializeUtilityManagers() {
        const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
        const utilityName = generalConfig.get<string>('utility')!;
        
        if(this._selectedUtility !== utilityName){
            this._webAppManager = UtilityManagersFactory.createWebAppManager(utilityName);
            this._packageDeploymentManager = UtilityManagersFactory.createPackageDeploymentManager(utilityName);
            this._selectedUtility = utilityName;
        }
    }
  }