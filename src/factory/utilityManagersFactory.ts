import { BasePackageActions } from "../abstractions/basePackageActions";
import { BaseWebAppManager } from "../abstractions/baseWebAppManager";
import { ClioPackageActions } from "../implements/clio/clioPackageActions";
import { ClioWebAppManager } from "../implements/clio/clioWebAppManager";
import { UbsPackageActions } from "../implements/ubs/ubsPackageActions";
import { UbsWebAppManager } from "../implements/ubs/ubsWebAppManager";
import { PackageDeploymentManager } from "../managers/packageDeploymentManager";
import { PowerShellWrapper } from "../terminal/terminalwrapper";


export class UtilityManagersFactory {
    
    static createPackageDeploymentManager(utilityName: string): PackageDeploymentManager {
        const shellWrapper = new PowerShellWrapper();
        let packageActions: BasePackageActions;
        switch(utilityName){
            case `clio`:
                packageActions = new ClioPackageActions(shellWrapper);
                break;
            case `ubs`:
            default:
                packageActions = new UbsPackageActions(shellWrapper);
                break;
        }
        return new PackageDeploymentManager(packageActions);
    }

    static createWebAppManager(utilityName: string): BaseWebAppManager {
        const shellWrapper = new PowerShellWrapper();
        switch(utilityName){
            case `clio`:
                return new ClioWebAppManager(shellWrapper);
            case `ubs`:
            default:
                return new UbsWebAppManager(shellWrapper);
        }
    }
}