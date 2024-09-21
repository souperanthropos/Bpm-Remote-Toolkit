import * as vscode from 'vscode';
import { GitHelper } from '../git';
import { packageSettings, queueItem, enviromentSettings } from '../interfaces';
import { ExtensionSettings } from '../constants';
import { PackageManager } from './packagemanager';

export class PackageDeploymentManager {
    private readonly _gitHelper: GitHelper;
    private readonly _pm: PackageManager;
    private readonly _queueItems: queueItem[];

    private selectedServer!: enviromentSettings;

    constructor(packageManager: PackageManager){
        this._gitHelper = new GitHelper();
        this._pm = packageManager;
        this._queueItems = new Array();
    }

    private delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    private addItem(pkg: packageSettings) {
        const newItem: queueItem = {
            environment: this.selectedServer,
            package: pkg,
            isRunning: false,
            Completed: null
        };
        this._queueItems.push(newItem);
        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
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
                        this.addItem(pkg);
                        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', true);
                    }
                    qp.hide();
    
                });
                qp.onDidHide(() => qp.dispose());
                qp.show();
            }else{
                if (!this._queueItems.find(p => p.package === pkg)) {
                    this.addItem(pkg);
				}
            }
		}
    }

    public async startDeployment() {
        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', false);
        for await (const element of this._queueItems) {
            element.isRunning = true;
            vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
            var result = await this._pm.createPackage(element.package.targetFolderPath);
            if(!result){
                element.isRunning = false;
                element.Completed = { isSuccess: false };
                vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                break;
            }else{
                result = await this._pm.pushPackage(element.package);
                if(!result){
                    element.isRunning = false;
                    element.Completed = { isSuccess: false };
                    vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                }else{
                    element.Completed = { isSuccess: true };
                    vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                }
            }
        }
    }
}