import * as vscode from 'vscode';
import path from 'path';
import { enviromentSettings } from '../interfaces';
import { DataTimeUtility } from '../common/utilities/dataTimeUtility';
import { FileManager } from './filemanager';
import { PowerShellWrapper, TerminalWrapper } from '../terminal/terminalwrapper';

export class ExtensionManager {
	private _environments: enviromentSettings[] = [];
	private _selectedUtility: string = 'auto';
	private _autoUpdateTime = false;
	private _packToZip = false;

	public readonly terminalWrapper: TerminalWrapper = new PowerShellWrapper();
	public readonly fileManager: FileManager = new FileManager();

	public get environments(): ReadonlyArray<enviromentSettings> {
		return this._environments;
	}

	public get selectedUtility(): string {
		return this._selectedUtility;
	}
	
	public get autoUpdateTime(): boolean {
		return this._autoUpdateTime;
	}

	public get packToZip(): boolean {
		return this._packToZip;
	}

	public onSelectedUtilityChanged?: () => void;

	constructor() {
		this.registerEvents();
	}

	private registerEvents(){
		vscode.workspace.onDidChangeConfiguration((configEvent) =>{
			this.initializeProperties(configEvent);
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

	private initializeProperties(configEvent: vscode.ConfigurationChangeEvent) {
		const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
		this._selectedUtility = generalConfig.get<string>('utility')!;
		this._autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
		this._packToZip = generalConfig.get<boolean>('packToZip')!;

		if(configEvent.affectsConfiguration('bpmtoolkit.general.utility')){
			if (this.onSelectedUtilityChanged) {
				this.onSelectedUtilityChanged();
			}
		}
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
		const uri = vscode.Uri.file(this.fileManager.executeLogFilePath);
        const options = { recursive: false, useTrash: false };
        try {
            await vscode.workspace.fs.delete(uri, options);
        } catch {}
	}
}