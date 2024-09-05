import * as vscode from 'vscode';
import { Constants, getDirectoryName, showErrorMessage, showInformationMessage } from './constants';
import { GitHelper } from './git';
import { PackageManager } from './managers/packagemanager';

export class PackageExplorer {
	private readonly _gitHelper: GitHelper;
	private readonly _pm: PackageManager;

	constructor(private terminalLog: vscode.OutputChannel) {
		this._gitHelper = new GitHelper(terminalLog);
		this._pm = new PackageManager(terminalLog);

		this._pm.onCommandExecuteError = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) =>
			showErrorMessage(message, showbutton, executeLogFilePath);
		this._pm.onCommandExecuteComplete = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) =>
			showInformationMessage(message, showbutton, executeLogFilePath);
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