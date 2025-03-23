import { BasePackageActions } from "../abstractions/basePackageActions";
import { PackageSettings } from "../common/packageSettings";

export class EmptyPackageActions extends BasePackageActions {

    private readonly _errorMessage: string = 'Utility is not installed.';

    protected override async createGZFile(): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }

    protected override async internalPushPackage(enviromentId: string): Promise<boolean> {
        this.commandExecuteError(this._errorMessage);
        throw new Error(this._errorMessage);
    }
}