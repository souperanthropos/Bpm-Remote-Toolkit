import * as vscode from 'vscode';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { UtilityManagersFactory } from './factory/utilityManagersFactory';
import { BaseWebAppManager } from './abstractions/baseWebAppManager';
import { EmptyWebAppManager } from './implements/emptyWebAppManager';
import { ExtensionManager } from './managers/extensionManager';

export class BpmToolkit {
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _webAppManager!: BaseWebAppManager;

    private _selectedUtilityStatus: vscode.StatusBarItem;
  
    constructor(public readonly extensionManager: ExtensionManager) {
        this._selectedUtilityStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._selectedUtilityStatus.show();
        this.initializeUtilityManagers();
        extensionManager.onSelectedUtilityChanged = this.initializeUtilityManagers;
    }

    private async initializeUtilityManagers() {
        var factory = new UtilityManagersFactory(this.extensionManager);
        this._selectedUtilityStatus.text = `Selected utility: ${factory.selectedUtility}`;
        this._webAppManager = await factory.createWebAppManager();
        this._packageDeploymentManager = await factory.createPackageDeploymentManager();

        if(this._webAppManager instanceof EmptyWebAppManager){
            if(factory.selectedUtility !== 'auto-detection failed'){
                this._selectedUtilityStatus.text += ' (not installed)';
            }else{
                const options: vscode.MessageOptions = { modal: true };
                await vscode.window.showInformationMessage('Utility auto-detection failed.\nGo to extension setting "BPM Remote Toolkit" and select utility manually.', options);
            }
        }
    }

    public get packageDeploymentManager(): PackageDeploymentManager{
        return this._packageDeploymentManager;
    }

    public get webAppManager(): BaseWebAppManager{
        return this._webAppManager;
    }
  }