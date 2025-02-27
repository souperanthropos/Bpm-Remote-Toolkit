import * as vscode from 'vscode';
import { packageSettings, queueItem, enviromentSettings } from '../interfaces';
import { GitHelper } from '../common/git';
import { ExtensionSettings } from '../common/extensionSettings';
import { FolderType, getDirectoryName, showErrorMessage } from '../constants';
import { Logger } from '../common/logger';
import { BasePackageActions } from '../abstractions/basePackageActions';
import path from 'path';
import { FileManager } from './filemanager';

export class PackageDeploymentManager {
    private readonly _gitHelper: GitHelper;
    private readonly _queueItems: queueItem[];
    private readonly _fileManager: FileManager;
    private selectedServer?: enviromentSettings;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private packageActions: BasePackageActions) {
        this._gitHelper = new GitHelper();
        this._queueItems = new Array();
        this._fileManager = new FileManager();
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

    private clearIfDeployed() {
        if(this._queueItems.filter(q=>q.Completed !== null).length > 0){
            this.clear();
        }
    }

    // #region IPackageActions implementation

    public async createPackage(settings: packageSettings): Promise<boolean> {
        const packageFileName = `${getDirectoryName(settings.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        await this._fileManager.DeleteFile(outPathPackageFile);
        const result = await this.packageActions.createPackage(settings);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true);
        }

        return result;
    }

    public createPackageWithProgress(pkg: packageSettings) {
        if (ExtensionSettings.environments) {
            const branches = ExtensionSettings.environments.map(({ gitBranchName }) => gitBranchName ?? '');
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating package: ${pkg.folderName}.gz`
                },
                async () => {
                    vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
                    if (await this._gitHelper.isPermittedBranch(branches)) {
                        await this._fileManager.DeleteFile(Logger.getExecuteLogFilePath());
                        if (await this.createPackage(pkg)) {
                            if (ExtensionSettings.outputPath(FolderType.package)) {
                                vscode.env.openExternal(vscode.Uri.file(ExtensionSettings.outputPath(FolderType.package)));
                            }
                        }
                    }
                    vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
                }
            );
        } else {
            vscode.window.showInformationMessage(
                "Command execute failed: check you .code-workspace file."
            );
        }
    }

    public async pushPackage(settings: packageSettings): Promise<boolean>  {
        if (settings.targetEnviroment === null) {
            Logger.writeToChannel('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false);
            }
            return false;
        }

        const result = await this.packageActions.pushPackage(settings);

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

    public addQueueItems(pkgs: packageSettings[]) {
        const currentBranch = this._gitHelper.getCurrentBranch();
        this.clearIfDeployed();
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
                        pkgs.forEach(pkg=>{
                            pkg.targetEnviroment = server;
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
                        pkg.targetEnviroment = this.selectedServer!;
                        this.addItem(pkg);
                    }
                });
            }
        }
    }

    public addQueueItem(pkg: packageSettings, forceStartDeployment: boolean) {
        const currentBranch = this._gitHelper.getCurrentBranch();
        this.clearIfDeployed();
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
        await Logger.writeToExecuteLogFile('START DEPLOYMENT', true);
        for await (const element of this._queueItems) {
            if (!await this._gitHelper.checkBranch(element.package.targetEnviroment!.gitBranchName!)){
                break;
            }
            element.isRunning = true;
            vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
            statusBarItem.text = '$(loading~spin) Create package...';
            await Logger.writeToExecuteLogFile(`[${element.package.targetEnviroment?.id}] - Start package creating ${element.package.folderName}.gz.`, true);
            var result = await this.createPackage(element.package);
            if (!result) {
                element.isRunning = false;
                element.Completed = { isSuccess: false };
                vscode.commands.executeCommand('packageDeploymentManagement.refreshEntry');
                break;
            } else {
                statusBarItem.text = '$(loading~spin) Sending package...';
                await Logger.writeToExecuteLogFile(`[${element.package.targetEnviroment?.id}] - Start package uploading ${element.package.folderName}.gz.`, true);
                result = await this.pushPackage(element.package);
                element.isRunning = false;
                if (!result) {
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
        await Logger.writeToExecuteLogFile('FINISH DEPLOYMENT', true);
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