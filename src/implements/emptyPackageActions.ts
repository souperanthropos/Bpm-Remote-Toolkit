import { BasePackageActions } from "../abstractions/basePackageActions";
import { packageSettings } from "../interfaces";

export class EmptyPackageActions extends BasePackageActions {

    private readonly _errorMessage: string = 'Utility is not installed.';

    public override async createPackage(pkg: packageSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }

    public override async pushPackage(pkg: packageSettings): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }
}