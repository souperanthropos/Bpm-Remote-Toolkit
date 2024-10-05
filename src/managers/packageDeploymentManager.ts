import * as vscode from 'vscode';
import { packageSettings, queueItem, enviromentSettings } from '../interfaces';
import { PackageManager } from './packagemanager';
import { GitHelper } from '../common/git';
import { ExtensionSettings } from '../common/extensionSettings';
import { showErrorMessage } from '../constants';
import { Logger } from '../common/logger';

export class PackageDeploymentManager {
    private readonly _gitHelper: GitHelper;
    private readonly _packageManager: PackageManager;
    private readonly _queueItems: queueItem[];

    private selectedServer?: enviromentSettings;

    constructor(packageManager: PackageManager) {
        this._gitHelper = new GitHelper();
        this._packageManager = packageManager;
        this._queueItems = new Array();
    }

    private addItem(pkg: packageSettings) {
        const newItem: queueItem = {
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

    public addQueueItem(pkg: packageSettings, forceStartDeployment: boolean) {
        const currentBranch = this._gitHelper.getCurrentBranch();
        if (ExtensionSettings.environments && currentBranch !== '') {
            if (!this.selectedServer) {
                const arr = ExtensionSettings.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
                const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
                const qp = vscode.window.createQuickPick();
                qp.canSelectMany = false;
                qp.items = quickPickItems;
                qp.onDidChangeSelection(async selection => {
                    const serverId = selection[0].label;
                    const server = ExtensionSettings.environments!.find(e => e.id === serverId);
                    if (server) {
                        this.selectedServer = server;
                        pkg.targetEnviroment = server;
                        this.addItem(pkg);
                        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', true);
                        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', true);
                    }
                    qp.hide();
                    if(forceStartDeployment){
                        this.startDeployment();
                    }
                });
                qp.onDidHide(() => qp.dispose());
                qp.show();
            } else {
                if (!this._queueItems.find(p => p.package === pkg)) {
                    pkg.targetEnviroment = this.selectedServer;
                    this.addItem(pkg);
                }
            }
        }
    }

    public async startDeployment() {
        let ignorePushError = false;
        let abortDeployment = false;
        if(this._queueItems.length > 1){
            const options: vscode.MessageOptions = { modal: true };
            await vscode.window
            .showInformationMessage('Ignore package installation errors?', options, "Yes", "No")
            .then(answer => {
                if (answer === "Yes") {
                    ignorePushError = true;
                }else if (answer === undefined){
                    abortDeployment = true;
                }
            });
        }
        if(abortDeployment){
            return;
        }
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		statusBarItem.show();
        vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', false);
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', false);
        for await (const element of this._queueItems) {
            if (!await this._gitHelper.checkBranch(element.package.targetEnviroment!.gitBranchName!)){
                break;
            }
            element.isRunning = true;
            vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
            statusBarItem.text = '$(loading~spin) Create package...';
            var result = await this._packageManager.createPackage(element.package.targetFolderPath);
            if (!result) {
                element.isRunning = false;
                element.Completed = { isSuccess: false };
                vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                break;
            } else {
                statusBarItem.text = '$(loading~spin) Sending package...';
                result = await this._packageManager.pushPackage(element.package);
                if (!result) {
                    element.isRunning = false;
                    element.Completed = { isSuccess: false };
                    vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                    if (!ignorePushError) {
                        break;
                    }
                } else {
                    element.Completed = { isSuccess: true };
                    vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                }
            }
        }
        const deployErrorCount = this._queueItems.filter(q=>!q.Completed?.isSuccess).length;
        if(deployErrorCount > 0){
            showErrorMessage('Package deployment failed with an error.', true, Logger.getExecuteLogFilePath());
        }
        statusBarItem.hide();
        vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', true);
    }

    public clear() {
        while (this._queueItems.length > 0) {
            this._queueItems.pop();
        }
        this.selectedServer = undefined;
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', false);
        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', false);
        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
    }
}