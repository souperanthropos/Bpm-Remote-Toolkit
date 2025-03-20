import { BasePackageActions } from "../abstractions/basePackageActions";
import { PackageSettings } from "../common/packageSettings";

export class EmptyPackageActions extends BasePackageActions {

    private readonly _errorMessage: string = 'Utility is not installed.';

    public override async createPackage(pkg: PackageSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }

    public override async pushPackage(pkg: PackageSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }
}