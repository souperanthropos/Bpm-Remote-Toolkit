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
import { PowerShellWrapper } from "../terminal/terminalwrapper";


export class UtilityManagersFactory {
    private _checkInstalledSuccess: boolean = true;
    private _selectedUtility: string = 'auto-detection failed';
    private _autoDetectSuccess: boolean = true;
    private _shellWrapper = new PowerShellWrapper();

    public get selectedUtility(): string{
        return this._selectedUtility;
    }

    constructor(utilityName: string){
        if(utilityName === 'auto'){
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
        }else{
            this._selectedUtility = utilityName;
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
                    packageActions = new ClioPackageActions(this._shellWrapper);
                    break;
                case `ubs`:
                    packageActions = new UbsPackageActions(this._shellWrapper);
                    break;
                default:
                    packageActions = new EmptyPackageActions(this._shellWrapper);
                    break;
            }
        }else{
            packageActions = new EmptyPackageActions(this._shellWrapper);
        }
        return new PackageDeploymentManager(packageActions);
    }

    public async createWebAppManager(): Promise<BaseWebAppManager> {
        if(await this.isToolInstalled()){
            switch(this._selectedUtility){
                case `clio`:
                    return new ClioWebAppManager(this._shellWrapper);
                case `ubs`:
                    return new UbsWebAppManager(this._shellWrapper);
                default:
                    return new EmptyWebAppManager(this._shellWrapper);
            }
        }
        return new EmptyWebAppManager(this._shellWrapper);
    }
}