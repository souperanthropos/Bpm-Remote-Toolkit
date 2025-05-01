import * as vscode from 'vscode';
import path from 'path';
import { PackageDeploymentManager } from './managers/packageDeploymentManager';
import { UtilityManagersFactory } from './factory/utilityManagersFactory';
import { BaseWebAppManager } from './abstractions/baseWebAppManager';
import { EmptyWebAppManager } from './implements/emptyWebAppManager';
import { ExtensionManager } from './managers/extensionManager';
import { DataTimeUtility } from './common/utilities/dataTimeUtility';

export class BpmToolkit {
    private _packageDeploymentManager!: PackageDeploymentManager;
    private _webAppManager!: BaseWebAppManager;

    private _selectedUtilityStatus: vscode.StatusBarItem;

    public get packageDeploymentManager(): PackageDeploymentManager{
        return this._packageDeploymentManager;
    }

    public get webAppManager(): BaseWebAppManager{
        return this._webAppManager;
    }
  
    constructor(public readonly extensionManager: ExtensionManager) {
        this._selectedUtilityStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._selectedUtilityStatus.show();
        this.initializeUtilityManagers();
        extensionManager.onSelectedUtilityChanged = this.initializeUtilityManagers.bind(this);
        vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
			if (this.extensionManager.autoUpdateTime) {
				await this.UpdateTimeInDescriptor(document);
			}
		});
        vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
            if (document.uri.scheme === 'file' && document.uri.path.endsWith('metadata.json')){
                if(await this.isProcessFileOpened(path.dirname(document.uri.path))){
                    vscode.commands.executeCommand('bpmnViewer.startRender', document);
                }
            }
        });
        vscode.commands.executeCommand('bpmnViewer.requestLogin');
    }

    private async isProcessFileOpened(folderPath: string): Promise<boolean> {
        try {
            const descriptorFilePath = path.join(folderPath, 'descriptor.json');
            const readData = await vscode.workspace.fs.readFile(vscode.Uri.file(descriptorFilePath));
            const descriptorData = new TextDecoder('utf-8').decode(readData);
            return descriptorData.includes('ProcessSchemaManager');
        } catch {}

        return false;
    }

    private async initializeUtilityManagers() {
        var factory = new UtilityManagersFactory(this.extensionManager);
        this._selectedUtilityStatus.text = `Selected utility: ${factory.selectedUtility}`;
        this._webAppManager = await factory.createWebAppManager();
        this._packageDeploymentManager = await factory.createPackageDeploymentManager();

        if(this._webAppManager instanceof EmptyWebAppManager){
            if(factory.selectedUtility !== 'auto-detection failed'){
                this._selectedUtilityStatus.text += ' (not installed)';
            }else{
                const options: vscode.MessageOptions = { modal: true };
                await vscode.window.showInformationMessage(
                    'Utility auto-detection failed.\nGo to extension setting "BPM Remote Toolkit" and select utility manually.', 
                    options
                );
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
  }