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
    private _selectedUtility: string;
  
    constructor(public readonly extensionManager: ExtensionManager) {
        this._selectedUtility = '';
        this._selectedUtilityStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._selectedUtilityStatus.show();
        this.initializeUtilityManagers();
        vscode.workspace.onDidChangeConfiguration(async event => {
            if(event.affectsConfiguration('bpmtoolkit.general.utility')){
                await this.initializeUtilityManagers();
            }
        });
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
            var factory = new UtilityManagersFactory(utilityName);
            this._selectedUtilityStatus.text = `Selected utility: ${factory.selectedUtility}`;
            this._webAppManager = await factory.createWebAppManager();
            this._packageDeploymentManager = await factory.createPackageDeploymentManager();
            this._selectedUtility = utilityName;

            if(this._webAppManager instanceof EmptyWebAppManager){
                if(factory.selectedUtility !== 'auto-detection failed'){
                    this._selectedUtilityStatus.text += ' (not installed)';
                }else{
                    const options: vscode.MessageOptions = { modal: true };
                    await vscode.window.showInformationMessage('Utility auto-detection failed.\n Go to extension setting "BPM Remote Toolkit" and select utility manually.', options);
                }
            }
        }
    }
  }