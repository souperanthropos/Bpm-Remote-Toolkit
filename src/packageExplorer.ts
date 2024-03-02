import * as vscode from 'vscode';
import { packageSettings } from './interfaces';
import { Constants, getDirectoryName, isMatchingWorkspace, showErrorMessage, showInformationMessage } from './constants';
import { GitHelper } from './git';
import { PackageManager } from './managers/packagemanager';

export class PackageExplorer {
	private readonly _gitHelper: GitHelper;
	private readonly _pm: PackageManager;

	constructor(private terminalLog: vscode.OutputChannel) {
		this._gitHelper = new GitHelper(terminalLog);
		this._pm = new PackageManager(terminalLog);

		this._pm.onCommandExecuteError = (message: string, showbutton: boolean) => showErrorMessage(message, showbutton);
		this._pm.onCommandExecuteComplete = (message: string, showbutton: boolean) => showInformationMessage(message, showbutton);
	}

	public create(fsPath: string) {
		const config = vscode.workspace.getConfiguration('clio');
		const outputPath = config.get<string>('outputPath');

		if (Constants.environments) {
			const branches = Constants.environments.map(({ gitBranchName }) => gitBranchName ?? '');
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Creating package: ${getDirectoryName(fsPath)}.gz`
				},
				async () => {
					vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
					if (await this._gitHelper.isPermittedBranch(branches)) {
						if (await this._pm.createPackage(fsPath)) {
							if (outputPath) {
								vscode.env.openExternal(vscode.Uri.file(outputPath));
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

	public createAndSend(fsPath: string) {
		const currentBranch = this._gitHelper.getCurrentBranch();
		if (Constants.environments && currentBranch !== '') {
			const arr = Constants.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
			const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
			const qp = vscode.window.createQuickPick();
			qp.canSelectMany = false;
			qp.items = quickPickItems;
			qp.onDidChangeSelection(async selection => {
				const serverId = selection[0].label;
				const serverConfig = Constants.environments?.find(e => e.id === serverId);
				qp.hide();

				if (serverConfig && serverConfig.gitBranchName) {
					vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: 'Current operation'
						},
						async (progress) => {
							vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
							if (await this._gitHelper.checkBranch(serverConfig.gitBranchName!)) {
								var folderName = getDirectoryName(fsPath);
								progress.report({
									message: `creating package ${folderName}.gz`
								});
								if (await this._pm.createPackage(fsPath)) {
									progress.report({
										message: `sending package ${folderName}.gz`,
										increment: 50
									});
									await this._pm.pushPackage(
										{
											folderName: folderName,
											targetFolderPath: fsPath,
											targetEnviroment: serverConfig.id
										}
									);
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
			});
			qp.onDidHide(() => qp.dispose());
			qp.show();
		}
	}
}

export class PackageProvider implements vscode.TreeDataProvider<packageSettings> {
	private _onDidChangeTreeData: vscode.EventEmitter<packageSettings | undefined | void> = new vscode.EventEmitter<packageSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<packageSettings | undefined | void> = this._onDidChangeTreeData.event;

	private _packages: packageSettings[] | undefined;

	refresh(env: packageSettings[]): void {
		this._packages = env;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: packageSettings): vscode.TreeItem {
		var treeItem = new packageTreeItem(
			element.folderName,
			element.targetFolderPath,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.tooltip = element.targetFolderPath;
		if (isMatchingWorkspace(element.targetFolderPath)) {
			treeItem.contextValue += 'Enable';
			treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("bpmsoftEnvironment.enable"));
		} else {
			treeItem.contextValue += 'Disable';
			treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("bpmsoftEnvironment.disable"));
		}

		return treeItem;
	}

	getChildren(): Thenable<packageSettings[]> {
		if (!this._packages) {
			return Promise.resolve([]);
		}

		return Promise.resolve(this._packages);
	}
}

export class packageTreeItem extends vscode.TreeItem {
	constructor(
		public readonly name: string,
		public readonly folderPath: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public contextValue: string = 'packageTreeItem'
	) {
		super(name, collapsibleState);
	}
}