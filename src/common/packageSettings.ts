import * as path from "path";
import { FolderType, getDirectoryName } from "../constants";

export class PackageSettings {
    private readonly _targetFolderPath: string;
    private _packageFileName: string;

    public get targetFolderPath(): string {
        return this._targetFolderPath;
    }

    public get packageFileName(): string {
        return this._packageFileName;
    }

    public get outputPath(): string {
        return ExtensionSettings.outputPath(FolderType.package);
    }

    public get outputPathPackageFile(): string {
        return path.join(ExtensionSettings.outputPath(FolderType.package), this._packageFileName + '.gz');
    }

    constructor(folderPath: string){
        this._targetFolderPath = folderPath;
        this._packageFileName = getDirectoryName(folderPath);
    }
}