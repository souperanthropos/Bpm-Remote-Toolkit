import { getDirectoryName } from "../constants";

export class PackageSettings {
    private readonly _targetFolderPath: string;
    private _packageFileName: string;

    public get targetFolderPath(): string {
        return this._targetFolderPath;
    }

    public get packageFileName(): string {
        return this._packageFileName;
    }

    constructor(folderPath: string){
        this._targetFolderPath = folderPath;
        this._packageFileName = getDirectoryName(folderPath);
    }
}