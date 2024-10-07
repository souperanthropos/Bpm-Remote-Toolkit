import * as vscode from 'vscode';
import { packageSettings } from '../interfaces';
import { IPackageCommandExecutor } from '../interfaces';
import { FolderType } from '../constants';
import { GitHelper } from '../common/git';
import { ExtensionSettings } from '../common/extensionSettings';
import { Logger } from '../common/logger';

export class PackageManager {
    private readonly _gitHelper: GitHelper;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private commandExecutor: IPackageCommandExecutor) {
        this._gitHelper = new GitHelper();
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

    public async createPackage(settings: packageSettings): Promise<boolean> {
        const result = await this.commandExecutor.createPackage(settings);

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

        const result = await this.commandExecutor.pushPackage(settings);

        if (!result && this.onCommandExecuteError) {
            this.onCommandExecuteError('Send package failed.', true);
        }

        if (result && this.onCommandExecuteComplete) {
            this.onCommandExecuteComplete('Send package completed.', true);
        }

        return result;
    }
}