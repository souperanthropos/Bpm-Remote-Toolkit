import * as vscode from 'vscode';
import { queueItem, enviromentSettings } from '../interfaces';
import { GitHelper } from '../common/git';
import { ExtensionManager } from './extensionManager';
import { isNullOrWhitespace } from '../constants';
import { Logger } from '../common/logger';
import { BasePackageActions } from '../abstractions/basePackageActions';
import { PackageSettings } from '../common/packageSettings';
import { PowerShellRunCommand } from '../command/winCommand';

export class PackageDeploymentManager {
    private readonly _gitHelper: GitHelper;
    private readonly _queueItems: queueItem[];
    private _selectedServer?: enviromentSettings;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private readonly extensionManager: ExtensionManager, 
        private readonly packageActions: BasePackageActions) {
            this._gitHelper = new GitHelper();
            this._queueItems = new Array();
    }

    private addItem(pkg: PackageSettings) {
        const newItem: queueItem = {
            package: pkg,
            isRunning: false,
            Completed: null
        };
        this._queueItems.push(newItem);
        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
    }

    private clearIfDeployed() {
        if(this._queueItems.filter(q=>q.Completed !== null).length > 0){
            this.clear();
        }
    }

    // #region IPackageActions implementation

    private async createPackage(settings: PackageSettings): Promise<boolean> {
        const result = await this.packageActions.createPackage(settings);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true);
        }

        return result;
    }

    public createPackageWithProgress(pkg: PackageSettings) {
        const branches = this.extensionManager.environments.map(({ gitBranchName }) => gitBranchName ?? '');
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating package: ${pkg.packageFileName}.gz`
            },
            async () => {
                vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
                if (await this._gitHelper.isPermittedBranch(branches)) {
                    await this.extensionManager.clearPackageFolder();
                    await this.extensionManager.clearExecuteLogs();
                    if (await this.createPackage(pkg)) {
                        this.extensionManager.openPackageFolder();
                    }
                }
                vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
            }
        );
    }

    public async pushPackage(): Promise<boolean>  {
        if (this._selectedServer === null) {
            Logger.writeToChannel('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false);
            }
            return false;
        }

        const result = await this.packageActions.pushPackage(this._selectedServer!.id);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true);
        }

        return result;
    }

    // #endregion

    public getItems(): ReadonlyArray<queueItem> {
        return this._queueItems;
    }

    public addQueueItems(pkgs: PackageSettings[]) {
        const currentBranch = this._gitHelper.getCurrentBranch();
        this.clearIfDeployed();
        if (this.extensionManager.environments && currentBranch !== '') {
            if (!this._selectedServer) {
                const arr = this.extensionManager.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
                const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
                const qp = vscode.window.createQuickPick();
                qp.canSelectMany = false;
                qp.items = quickPickItems;
                qp.onDidChangeSelection(async selection => {
                    const serverId = selection[0].label;
                    const server = this.extensionManager.environments!.find(e => e.id === serverId);
                    if (server) {
                        this._selectedServer = server;
                        pkgs.forEach(pkg=>{
                            this.addItem(pkg);
                        });
                        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', true);
                        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', true);
                    }
                    qp.hide();
                });
                qp.onDidHide(() => qp.dispose());
                qp.show();
            } else {
                pkgs.forEach(pkg=>{
                    if (!this._queueItems.find(p => p.package === pkg)) {
                        this.addItem(pkg);
                    }
                });
            }
        }
    }

    public addQueueItem(pkg: PackageSettings, forceStartDeployment: boolean) {
        const currentBranch = this._gitHelper.getCurrentBranch();
        this.clearIfDeployed();
        if (this.extensionManager.environments && currentBranch !== '') {
            if (!this._selectedServer) {
                const arr = this.extensionManager.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
                const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
                const qp = vscode.window.createQuickPick();
                qp.canSelectMany = false;
                qp.items = quickPickItems;
                qp.onDidChangeSelection(async selection => {
                    const serverId = selection[0].label;
                    const server = this.extensionManager.environments!.find(e => e.id === serverId);
                    if (server) {
                        this._selectedServer = server;
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
                    this.addItem(pkg);
                }
            }
        }
    }

    public async startDeployment() {
        await this.extensionManager.clearPackageFolder();
        await this.extensionManager.clearExecuteLogs();
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		statusBarItem.show();
        vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', false);
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', false);
        await this.extensionManager.writeToExecuteLogFile('START DEPLOYMENT');
        for await (const element of this._queueItems) {
            if (!await this._gitHelper.checkBranch(this._selectedServer!.gitBranchName!)){
                break;
            }
            element.isRunning = true;
            vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
            statusBarItem.text = '$(loading~spin) Create package...';
            await this.extensionManager.writeToExecuteLogFile(`[${this._selectedServer?.id}] - Start package creating ${element.package.packageFileName}.`);
            var result = await this.createPackage(element.package);
            element.isRunning = false;
            element.Completed = { isSuccess: result };
            vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
            if (!result) {
                break;
            }
        }

        statusBarItem.text = '$(loading~spin) Sending package...';
        await this.extensionManager.writeToExecuteLogFile(`[${this._selectedServer?.id}] - Start package uploading`);

        for await (const element of this._queueItems) {
            if (!await this._gitHelper.checkBranch(this._selectedServer!.gitBranchName!)){
                break;
            }
            element.isRunning = true;
        }
        
        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
        
        result = await this.pushPackage();

        for await (const element of this._queueItems) {
            if (!await this._gitHelper.checkBranch(this._selectedServer!.gitBranchName!)){
                break;
            }
            element.isRunning = false;
            element.Completed = { isSuccess: result };
        }

        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
        
        const currentBranch = this._gitHelper.getCurrentBranch();
        var currentEnviroment = this.extensionManager.environments?.filter(e => e.gitBranchName === currentBranch)[0];
        if(currentEnviroment && !isNullOrWhitespace(currentEnviroment.postRunCommand)){
            statusBarItem.text = '$(loading~spin) Post run command...';
            await this.extensionManager.writeToExecuteLogFile(`Post run command`);
            var command = new PowerShellRunCommand(this.extensionManager.terminalWrapper, currentEnviroment.postRunCommand!);
            await command.execute();
        }
        await this.extensionManager.writeToExecuteLogFile('FINISH DEPLOYMENT');
        const deployErrorCount = this._queueItems.filter(q=>!q.Completed?.isSuccess).length;
        if(deployErrorCount > 0){
            this.extensionManager.showErrorMessage('Package deployment failed with an error.', true);
        }
        statusBarItem.hide();
        vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', true);
    }

    public clear() {
        while (this._queueItems.length > 0) {
            this._queueItems.pop();
        }
        this._selectedServer = undefined;
        vscode.commands.executeCommand('setContext', 'isShowClearDeploymentCommand', false);
        vscode.commands.executeCommand('setContext', 'isShowStartDeploymentCommand', false);
        vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
    }
}