import * as vscode from 'vscode';
import path from 'path';
import * as os from 'os';
import { DataTimeUtility } from '../common/utilities/dataTimeUtility';

export class FileManager {
	private static readonly workDirName = 'bpmtoolkit';
	private static readonly pkgDirName = 'packages';
	private static readonly terminalDirName = 'terminal';

    private readonly _workingDirPath: string;
    private readonly _pkgDirPath: string;
    private readonly _terminalDirPath: string;

    public get packageDirPath(): string {
        return this._pkgDirPath;
    }

    public get terminalDirPath(): string {
		return this._terminalDirPath;
	}

    constructor() {
        this._workingDirPath = path.join(os.tmpdir(), FileManager.workDirName);
        this._pkgDirPath = path.join(this._workingDirPath, FileManager.pkgDirName);
        this._terminalDirPath = path.join(this._workingDirPath, FileManager.terminalDirName);
        this.initializeDirectories();
    }

    private initializeDirectories() {
        try {
            vscode.workspace.fs.createDirectory(vscode.Uri.file(this._workingDirPath));
        } catch {}
        try {
            vscode.workspace.fs.createDirectory(vscode.Uri.file(this._pkgDirPath));
        } catch {}
        try {
            vscode.workspace.fs.createDirectory(vscode.Uri.file(this._terminalDirPath));
        } catch {}
    }

    public async DeleteFile(filePath: string) {
        try{
            await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
        }
        catch{}
    }

    public async appendToFile(filePath: string, content: string) {
        let readStr = '';
        const uri = vscode.Uri.file(filePath);
        try{
            const readData = await vscode.workspace.fs.readFile(uri);
            readStr = new TextDecoder('utf-8').decode(readData);
        }
        catch{}
        if(readStr === ''){
            readStr += '\n';
        }
        readStr += DataTimeUtility.formatDate(new Date()) + ' - ' + content + '\n';
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(readStr));
    }
}