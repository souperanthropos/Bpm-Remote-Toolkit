import * as vscode from 'vscode';
import { packageSettings } from '../interfaces';
import { IPackageCommandExecutor } from '../interfaces';
import { FolderType, getDirectoryName } from '../constants';
import { GitHelper } from '../common/git';
import { ExtensionSettings } from '../common/extensionSettings';
import { Logger } from '../common/logger';

export class PackageManager {
    private readonly _gitHelper: GitHelper;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private wrapper: IPackageCommandExecutor) {
        this._gitHelper = new GitHelper();
    }

    public createPackageWithProgress(fsPath: string) {
		if (ExtensionSettings.environments) {
			const branches = ExtensionSettings.environments.map(({ gitBranchName }) => gitBranchName ?? '');
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Creating package: ${getDirectoryName(fsPath)}.gz`
				},
				async () => {
					vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
					if (await this._gitHelper.isPermittedBranch(branches)) {
						if (await this.createPackage(fsPath)) {
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

    public deployPackageToSelectedServer(fsPath: string) {
		const currentBranch = this._gitHelper.getCurrentBranch();
		if (ExtensionSettings.environments && currentBranch !== '') {
			const arr = ExtensionSettings.environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
			const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
			const qp = vscode.window.createQuickPick();
			qp.canSelectMany = false;
			qp.items = quickPickItems;
			qp.onDidChangeSelection(async selection => {
				const serverId = selection[0].label;
				const serverConfig = ExtensionSettings.environments?.find(e => e.id === serverId);
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
								if (await this.createPackage(fsPath)) {
									progress.report({
										message: `sending package ${folderName}.gz`,
										increment: 50
									});
									await this.pushPackage(
										{
											folderName: folderName,
											targetFolderPath: fsPath,
											targetEnviroment: serverConfig
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

    public async createPackage(targetFolderPath: string): Promise<boolean> {
        const path = require("path");
        const fullPathFile = path.join(ExtensionSettings.outputPath(FolderType.package), getDirectoryName(targetFolderPath) + '.gz');

        const result = await this.wrapper.createPackage(targetFolderPath, fullPathFile);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Create package failed.', true);
        }

        return result;
    }

    public async pushPackage(settings: packageSettings): Promise<boolean>  {
        if (settings.targetEnviroment === null) {
            Logger.writeToChannel('Error: target enviroment not found');
            if (this.onCommandExecuteError) {
                this.onCommandExecuteError('Error: target enviroment not found.', false);
            }
            return false;
        }

        const result = await this.wrapper.pushPackage(settings);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true);
        }

        return result;
    }
}