import { getDirectoryName } from "../constants";

export class PackageSettings {
    private readonly _targetFolderPath: string;
    private _folderName: string;

    public get targetFolderPath(): string {
        return this._targetFolderPath;
    }

    public get folderName(): string {
        return this._folderName;
    }

    constructor(folderPath: string){
        this._targetFolderPath = folderPath;
        this._folderName = getDirectoryName(folderPath);
    }
}