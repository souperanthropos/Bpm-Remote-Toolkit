import * as vscode from 'vscode';
import { GitHelper } from '../git';
import { packageSettings, queueItem, serverSettings } from '../interfaces';
import { ExtensionSettings } from '../constants';

export class QueuePackagesManager {
    private readonly _gitHelper: GitHelper;
    private readonly _queueItems: queueItem[];

    private selectedServer!: serverSettings;

    constructor(){
        this._gitHelper = new GitHelper();
        this._queueItems = new Array();
    }

    public getItems(): ReadonlyArray<queueItem> {
        return this._queueItems;
    }

    public addQueueItem(pkg: packageSettings){
		const currentBranch = this._gitHelper.getCurrentBranch();
		if (ExtensionSettings.environments && currentBranch !== '') {
            if(!this.selectedServer){
                const arr = ExtensionSettings.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
                const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
                const qp = vscode.window.createQuickPick();
                qp.canSelectMany = false;
                qp.items = quickPickItems;
                qp.onDidChangeSelection(async selection => {
                    const serverId = selection[0].label;
                    const server = ExtensionSettings.environments!.find(e => e.id === serverId);
                    if(server){
                        this.selectedServer = server;
                        const newItem: queueItem = {
                            environment: this.selectedServer,
                            package: pkg,
                            isRunning: false
                        };
                        this._queueItems.push(newItem);
                        vscode.commands.executeCommand('queuePackagesExplorer.refreshEntry');
                    }
                    qp.hide();
    
                });
                qp.onDidHide(() => qp.dispose());
                qp.show();
            }else{
                const newItem: queueItem = {
                    environment: this.selectedServer,
                    package: pkg,
                    isRunning: false
				};
                this._queueItems.push(newItem);
                vscode.commands.executeCommand('queuePackagesExplorer.refreshEntry');
            }
		}
    }
}