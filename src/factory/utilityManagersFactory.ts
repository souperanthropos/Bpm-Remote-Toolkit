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
    private static checkInstalledSuccess: boolean = true;

    static createPackageDeploymentManager(utilityName: string): PackageDeploymentManager {
        const shellWrapper = new PowerShellWrapper();
        let packageActions: BasePackageActions;
        if(!this.checkInstalledSuccess){
            packageActions = new EmptyPackageActions(shellWrapper);
        }else{
            switch(utilityName){
                case `clio`:
                    packageActions = new ClioPackageActions(shellWrapper);
                    break;
                case `ubs`:
                default:
                    packageActions = new UbsPackageActions(shellWrapper);
                    break;
            }
        }
        return new PackageDeploymentManager(packageActions);
    }

    static async createWebAppManager(utilityName: string): Promise<BaseWebAppManager> {
        const shellWrapper = new PowerShellWrapper();
        switch(utilityName){
            case `clio`:
                const checkClioCommand = new ClioCheckInstalledCommand(shellWrapper);
                this.checkInstalledSuccess = await checkClioCommand.execute();
                return this.checkInstalledSuccess ? new ClioWebAppManager(shellWrapper) : new EmptyWebAppManager(shellWrapper);
            case `ubs`:
            default:
                const checkUbsCommand = new UbsCheckInstalledCommand(shellWrapper);
                this.checkInstalledSuccess = await checkUbsCommand.execute();
                return this.checkInstalledSuccess ? new UbsWebAppManager(shellWrapper) : new EmptyWebAppManager(shellWrapper);
        }
    }
}