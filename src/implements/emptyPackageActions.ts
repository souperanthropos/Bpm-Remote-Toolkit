import { BasePackageActions } from "../abstractions/basePackageActions";
import { packageSettings } from "../interfaces";

export class EmptyPackageActions extends BasePackageActions {

    public override async createPackage(pkg: packageSettings): Promise<boolean> {
        this.commandExecuteError('Utility is not installed.');
        throw new Error('Utility is not installed.');
    }

    public override async pushPackage(pkg: packageSettings): Promise<boolean> {
        this.commandExecuteError('Utility is not installed.');
        throw new Error('Utility is not installed.');
    }
}