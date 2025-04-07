import * as vscode from 'vscode';
import path from 'path';
import { enviromentSettings } from '../interfaces';
import { FileManager } from './filemanager';
import { PowerShellWrapper, TerminalWrapper } from '../terminal/terminalwrapper';

export class ExtensionManager {
	private readonly fileManager: FileManager;
	
	private _environments: enviromentSettings[] = [];
	private _selectedUtility: string = 'auto';
	private _autoUpdateTime = false;
	private _packToZip = false;

	public readonly terminalWrapper: TerminalWrapper;

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

	public get packageDirPath(): string {
		return this.fileManager.packageDirPath;
	}

	public onSelectedUtilityChanged?: () => void;

	constructor() {
		this.registerEvents();
		this.initializeProperties();
		this.fileManager = new FileManager();
		this.terminalWrapper = new PowerShellWrapper(this.fileManager.terminalDirPath, 'bpmtoolkit');
	}

	private registerEvents(){
		vscode.workspace.onDidChangeConfiguration((configEvent) =>{
			this.initializeProperties(configEvent);
			this.initializeEnvironments();
			vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
			vscode.commands.executeCommand('packagesExplorer.refreshEntry');
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

	private initializeProperties(configEvent?: vscode.ConfigurationChangeEvent) {
		const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
		this._selectedUtility = generalConfig.get<string>('utility')!;
		this._autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
		this._packToZip = generalConfig.get<boolean>('packToZip')!;

		if(configEvent && configEvent.affectsConfiguration('bpmtoolkit.general.utility')){
			if (this.onSelectedUtilityChanged) {
				this.onSelectedUtilityChanged();
			}
		}
	}

	public async writeToExecuteLogFile(message: string) {
		await this.fileManager.appendToFile(this.terminalWrapper.executeLogFilePath, message);
	}

	public showErrorMessage(message: string, showbutton: boolean) {
		const buttonShowLog = showbutton ? "Show log file" : '';
		vscode.window.showErrorMessage(message, buttonShowLog)
			.then(selection => {
				if (selection === buttonShowLog) {
					const folderUri = vscode.Uri.file(this.terminalWrapper.executeLogFilePath);
					vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
				}
			});
	};

	public openPackageFolder() {
		vscode.env.openExternal(vscode.Uri.file(this.fileManager.packageDirPath));
	}

	public openExecuteLog() {
        const folderUri = vscode.Uri.file(this.terminalWrapper.executeLogFilePath);
		vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
    }

	public async clearPackageFolder() {
		const uri = vscode.Uri.file(this.fileManager.packageDirPath);
        try {
			for (const [name, type] of await vscode.workspace.fs.readDirectory(uri)) {
                const filePath = path.join(this.fileManager.packageDirPath, name);
				await this.fileManager.DeleteFile(filePath);
			}
        } catch {}
	}

	public async clearExecuteLogs() {
		const uri = vscode.Uri.file(this.terminalWrapper.executeLogFilePath);
        const options = { recursive: false, useTrash: false };
        try {
            await vscode.workspace.fs.delete(uri, options);
        } catch {}
	}
}