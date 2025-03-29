import * as vscode from 'vscode';
import path from 'path';
import * as os from 'os';
import { enviromentSettings } from '../interfaces';
import { DataTimeUtility } from '../common/utilities/dataTimeUtility';

export class ExtensionManager {
	private static readonly workDirName = 'bpmtoolkit';
	private static readonly pkgDirName = 'packages';
	private static readonly terminalDirName = 'terminal';
	private static readonly executeResultFileName = 'commandExecuteResult.log';
	private static readonly executeLogFileName = 'commandExecute.log';

	private readonly _workingDirPath: string;
	private readonly _pkgDirPath: string;
	private readonly _terminalDirPath: string;

	private _environments: enviromentSettings[] = [];
	private _autoUpdateTime = false;
	private _packToZip = false;

	public get environments(): ReadonlyArray<enviromentSettings> {
		return this._environments;
	}
	public get autoUpdateTime(): boolean {
		return this._autoUpdateTime;
	}
	public get packToZip(): boolean {
		return this._packToZip;
	}

	public get executeLogFilePath(): string {
		return path.join(this._terminalDirPath, ExtensionManager.executeLogFileName);
	}

	constructor() {
		this._workingDirPath = path.join(os.tmpdir(), ExtensionManager.workDirName);
		this._pkgDirPath = path.join(this._workingDirPath, ExtensionManager.pkgDirName);
		this._terminalDirPath = path.join(this._workingDirPath, ExtensionManager.terminalDirName);
		this.initializeDirectories();
		this.registerEvents();
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

	private registerEvents(){
		vscode.workspace.onDidChangeConfiguration(() =>{
			this.initializeProperties();
			this.initializeEnvironments();
			vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
			vscode.commands.executeCommand('packagesExplorer.refreshEntry');
		});
		vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
			if (this._autoUpdateTime) {
				await this.UpdateTimeInDescriptor(document);
			}
		});
	}

	private initializeEnvironments() {
		const config = vscode.workspace.getConfiguration('bpmtoolkit');
		const environments = config.get<enviromentSettings[]>('environments');

		if(environments) {
			this._environments = environments;
		}else {
			this._environments = [];
		}

		if (this._environments.length > 0) {
			vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
		} else {
			vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
		}
	}

	private initializeProperties() {
		const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
		this._autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
		this._packToZip = generalConfig.get<boolean>('packToZip')!;
	}

    private async UpdateTimeInDescriptor(document: vscode.TextDocument) {
        const fileStruct = path.parse(document.uri.fsPath);
        if(fileStruct.ext === '.cs' || fileStruct.ext === '.js'){
            const directory = fileStruct.dir;
            const descriptorFile = path.join(directory, 'descriptor.json');
    
            const readData = await vscode.workspace.fs.readFile(vscode.Uri.file(descriptorFile));
            let readStr = new TextDecoder('utf-8').decode(readData);

            const pattern = /("ModifiedOnUtc": "\\\/Date\()([0-9]+)(\)\\\/")/;
            var updateStr = readStr.replace(pattern, `$1${DataTimeUtility.getUnixTimeWithoutMilliseconds(Date.now())}$3`);
            await vscode.workspace.fs.writeFile(vscode.Uri.file(descriptorFile), new TextEncoder().encode(updateStr));
        }
    }

	public async clearLogs() {
		const uri = vscode.Uri.file(path.join(this._terminalDirPath, ExtensionManager.executeLogFileName));
        const options = { recursive: false, useTrash: false };
        try {
            await vscode.workspace.fs.delete(uri, options);
        } catch {}
	}
}