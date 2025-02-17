import { ClioCommandExecutor } from "../implements/clio/clioCommandExecutor";
import { ClioPackageCommandExecutor } from "../implements/clio/clioPackageCommandExecutor";
import { UbsCommandExecutor } from "../implements/ubs/ubsCommandExecutor";
import { UbsPackageCommandExecutor } from "../implements/ubs/ubsPackageCommandExecutor";
import { ICommandExecutor, IPackageCommandExecutor } from "../interfaces";
import { PackageDeploymentManager } from "../managers/packageDeploymentManager";
import { WebAppManager } from "../managers/webappmanager";
import { PowerShellWrapper } from "../terminal/terminalwrapper";


export class UtilityManagersFactory {
    static createPackageDeploymentManager(utilityName: string): PackageDeploymentManager {
        const shellWrapper = new PowerShellWrapper(false);
        let commandExecutor: IPackageCommandExecutor;
        switch(utilityName){
            case `clio`:
                commandExecutor = new ClioPackageCommandExecutor(shellWrapper);
            case `ubs`:
            default:
                commandExecutor = new UbsPackageCommandExecutor(shellWrapper);
        }
        return new PackageDeploymentManager(commandExecutor);
    }

    static createWebAppManager(utilityName: string): WebAppManager {
        const shellWrapper = new PowerShellWrapper(true);
        let commandExecutor: ICommandExecutor;
        switch(utilityName){
            case `clio`:
                commandExecutor = new ClioCommandExecutor(shellWrapper);
            case `ubs`:
            default:
                commandExecutor = new UbsCommandExecutor(shellWrapper);
        }
        return new WebAppManager(commandExecutor);
    }
}