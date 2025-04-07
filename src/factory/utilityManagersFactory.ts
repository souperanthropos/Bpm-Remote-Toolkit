import * as vscode from 'vscode';
import { BasePackageActions } from "../abstractions/basePackageActions";
import { BaseWebAppManager } from "../abstractions/baseWebAppManager";
import { ClioCheckInstalledCommand } from "../command/clioCommands";
import { UbsCheckInstalledCommand } from "../command/ubsCommands";
import { ClioPackageActions } from "../implements/clio/clioPackageActions";
import { ClioWebAppManager } from "../implements/clio/clioWebAppManager";
import { EmptyPackageActions } from "../implements/emptyPackageActions";
import { EmptyWebAppManager } from "../implements/emptyWebAppManager";
import { UbsPackageActions } from "../implements/ubs/ubsPackageActions";
import { UbsWebAppManager } from "../implements/ubs/ubsWebAppManager";
import { PackageDeploymentManager } from "../managers/packageDeploymentManager";
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { ExtensionManager } from '../managers/extensionManager';


export class UtilityManagersFactory {
    private _checkInstalledSuccess: boolean = false;
    private _selectedUtility: string = 'auto-detection failed';
    private _autoDetectSuccess: boolean = true;
    private _shellWrapper: TerminalWrapper;

    public get selectedUtility(): string{
        return this._selectedUtility;
    }

    constructor(private extensionManager: ExtensionManager){
        this._shellWrapper = extensionManager.terminalWrapper;
        if(extensionManager.selectedUtility === 'auto'){
            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0){
                const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                if(folder.includes('Terrasoft')){
                    this._selectedUtility = 'clio';
                }else if(folder.includes('BPMSoft')){
                    this._selectedUtility = 'ubs';   
                }else{
                    this._autoDetectSuccess = false;
                }
            }
        }
        else{
            this._selectedUtility = extensionManager.selectedUtility;
        }
    }

    private async isToolInstalled(): Promise<boolean> {
        if(this._autoDetectSuccess){
            if(this._checkInstalledSuccess){
                return true;
            }
            switch(this._selectedUtility){
                case `clio`:
                    const checkClioCommand = new ClioCheckInstalledCommand(this._shellWrapper);
                    this._checkInstalledSuccess = await checkClioCommand.execute();
                    return this._checkInstalledSuccess;
                case `ubs`:
                default:
                    const checkUbsCommand = new UbsCheckInstalledCommand(this._shellWrapper);
                    this._checkInstalledSuccess = await checkUbsCommand.execute();
                    return this._checkInstalledSuccess;
            }
        }
        return false;
    }

    public async createPackageDeploymentManager(): Promise<PackageDeploymentManager> {
        let packageActions: BasePackageActions;
        if(await this.isToolInstalled()){
            switch(this._selectedUtility){
                case `clio`:
                    packageActions = new ClioPackageActions(this.extensionManager);
                    break;
                case `ubs`:
                    packageActions = new UbsPackageActions(this.extensionManager);
                    break;
                default:
                    packageActions = new EmptyPackageActions(this.extensionManager);
                    break;
            }
        }else{
            packageActions = new EmptyPackageActions(this.extensionManager);
        }
        return new PackageDeploymentManager(this.extensionManager, packageActions);
    }

    public async createWebAppManager(): Promise<BaseWebAppManager> {
        if(await this.isToolInstalled()){
            switch(this._selectedUtility){
                case `clio`:
                    return new ClioWebAppManager(this.extensionManager);
                case `ubs`:
                    return new UbsWebAppManager(this.extensionManager);
                default:
                    return new EmptyWebAppManager(this.extensionManager);
            }
        }
        return new EmptyWebAppManager(this.extensionManager);
    }
}