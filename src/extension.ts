// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

import { EnvironmentsProvider } from './implements/environmentsProvider';
import { PackageProvider } from './implements/packageProvider';
import { PackageDeploymentProvider } from './implements/packageDeploymentProvider';
import { enviromentSettings } from './interfaces';
import { hash } from './constants';
import { BpmToolkit } from './bpmtoolkit';
import { ExtensionSettings } from './common/extensionSettings';
import { Logger } from './common/logger';
import { PackageSettings } from './common/packageSettings';

const bpmPackagesPattern = `${hash()}_bpmPackages`;

function initializeExtensionSettings(context: vscode.ExtensionContext){

	const generalConfig = vscode.workspace.getConfiguration('bpmtoolkit.general');
	ExtensionSettings.extensionPath = context.extensionPath;
	ExtensionSettings.autoUpdateTime = generalConfig.get<boolean>('autoUpdateTime')!;
	ExtensionSettings.packToZip = generalConfig.get<boolean>('packToZip')!;
	const serverConfig = vscode.workspace.getConfiguration('bpmtoolkit');
	ExtensionSettings.environments = serverConfig.get<enviromentSettings[]>('environments');

	if (ExtensionSettings.environments && ExtensionSettings.environments.length > 0) {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
	} else {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
	}

	vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
	vscode.commands.executeCommand('packagesExplorer.refreshEntry');
}

function registerButtonCommands(context: vscode.ExtensionContext){

	// #region buttons for Package Explorer

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.createPackageWithProgress', (pkg: PackageSettings) => {
		BpmToolkit.Instance.packageDeploymentManager.createPackageWithProgress(pkg);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.deployPackageToSelectedServer', async (pkg: PackageSettings) => {
		await BpmToolkit.Instance.fileManager.DeleteFile(Logger.getExecuteLogFilePath());
		BpmToolkit.Instance.packageDeploymentManager.clear();
		BpmToolkit.Instance.packageDeploymentManager.addQueueItem(pkg, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.openLastLog', () => {
		const folderUri = vscode.Uri.file(Logger.getExecuteLogFilePath());
		vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
	}));

	// #endregion

	// #region buttons for Server in BPM Environments

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.openSettings',
		() => BpmToolkit.Instance.webAppManager.openSettings()));

	context.subscriptions.push(vscode.commands.registerCommand('bpmEnvironments.server.register', async (server: enviromentSettings) => {
		vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Current operation'
			},
			async (progress) => {
				progress.report({
					message: 'server registration'
				});
				if (await BpmToolkit.Instance.webAppManager.webAppRegister(server)) {
					progress.report({
						message: 'check credential',
						increment: 50
					});
					if (await BpmToolkit.Instance.webAppManager.webAppPing(server)) {
						context.globalState.update(server.id, true);
					} else {
						progress.report({
							message: 'check credential failed',
							increment: 50
						});
						await BpmToolkit.Instance.webAppManager.webAppUnregister(server);
						context.globalState.update(server.id, false);
					}
					vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
				}
			}
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmEnvironments.server.unregister', async (server: enviromentSettings) => {
		await BpmToolkit.Instance.fileManager.DeleteFile(Logger.getExecuteLogFilePath());
		await BpmToolkit.Instance.webAppManager.webAppUnregister(server);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
	}));

	// #endregion

	// #region buttons for Package Deployment Management

	context.subscriptions.push(vscode.commands.registerCommand('packageDeploymentManagement.startDeployment', async () => {
		await BpmToolkit.Instance.fileManager.DeleteFile(Logger.getExecuteLogFilePath());
		BpmToolkit.Instance.packageDeploymentManager.startDeployment();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packageDeploymentManagement.clear',
		() => BpmToolkit.Instance.packageDeploymentManager.clear()
	));

	// #endregion
}

function registerContextMenus(context: vscode.ExtensionContext){

	// #region context menu for Package Explorer

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.remove', (contextSelection: PackageSettings, allSelections: PackageSettings[]) => {
		let packages = context.globalState.get<Array<string>>(bpmPackagesPattern) ?? new Array();
		if (packages.length > 0) {
			if (allSelections) {
				allSelections.forEach(pkg => {
					packages = packages.filter(item => { return item !== pkg.targetFolderPath; });
				});
			} else {
				packages = packages.filter(item => { return item !== contextSelection.targetFolderPath; });
			}
			context.globalState.update(bpmPackagesPattern, packages);
			vscode.commands.executeCommand('packagesExplorer.refreshEntry');
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.addDeployment', (contextSelection: PackageSettings, allSelections: PackageSettings[]) => {
		if(allSelections !== undefined){
			BpmToolkit.Instance.packageDeploymentManager.addQueueItems(allSelections);
		}else{
			BpmToolkit.Instance.packageDeploymentManager.addQueueItem(contextSelection, false);
		}
	}));

	// #endregion

	// #region context menu for Server in BPM Environments

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.restart',
		(server: enviromentSettings) => BpmToolkit.Instance.webAppManager.webAppRestart(server))
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.redisClear',
		(server: enviromentSettings) => BpmToolkit.Instance.webAppManager.clearRedisDb(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.compileConfiguration',
		(server: enviromentSettings) => BpmToolkit.Instance.webAppManager.compileConfiguration(server)));

	// #endregion

	// #region context menu for Explorer

	context.subscriptions.push(vscode.commands.registerCommand('explorer.folder.addPackage', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
		let packages = context.globalState.get<Array<string>>(bpmPackagesPattern) ?? new Array();
		allSelections.forEach(uri => {
			if (fs.lstatSync(uri.fsPath).isDirectory()) {
				if (!packages.find(item => item === uri.fsPath)) {
					packages.push(uri.fsPath);
					context.globalState.update(bpmPackagesPattern, packages);
				}
			}
		});
		vscode.commands.executeCommand('packagesExplorer.refreshEntry');
	}));

	// #endregion
}

function registerEvents(context: vscode.ExtensionContext){

	vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		if (ExtensionSettings.autoUpdateTime) {
			await BpmToolkit.Instance.fileManager.UpdateTimeInDescriptor(document);
		}
	});

	vscode.workspace.onDidChangeConfiguration(configChange => {
		initializeExtensionSettings(context);
	});
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	initializeExtensionSettings(context);
	registerButtonCommands(context);
	registerContextMenus(context);
	registerEvents(context);

	BpmToolkit.Instance;

	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	const packageDeploymentProvider = new PackageDeploymentProvider();

	vscode.window.registerTreeDataProvider('bpmEnvironments', environmentsProvider);

	vscode.window.createTreeView('packagesExplorer', {
		treeDataProvider: packageProvider,
		dragAndDropController: packageProvider,
		canSelectMany: true
	});

	vscode.window.createTreeView('packageDeploymentManagement', {
		treeDataProvider: packageDeploymentProvider,
		dragAndDropController: packageDeploymentProvider,
		canSelectMany: true
	});

	vscode.commands.registerCommand('bpmEnvironments.refreshEntry', () => {
		if (ExtensionSettings.environments) {
			ExtensionSettings.environments?.forEach(env => {
				var isReg = context.globalState.get(env.id);
				if (isReg) {
					env.isRegister = true;
				} else {
					env.isRegister = false;
				}
			});
			environmentsProvider.refresh(ExtensionSettings.environments);
		} else {
			environmentsProvider.refresh([]);
		}
	});

	vscode.commands.registerCommand('packagesExplorer.refreshEntry', () => {
		let packages = context.globalState.get<Array<string>>(bpmPackagesPattern) ?? new Array();

		if(packages.length > 0 && packages[0].targetFolderPath){
			for(let i=0; i < packages.length; i++){
				const item = packages[i].targetFolderPath;
				packages[i] = item;
			}
			context.globalState.update(bpmPackagesPattern, packages);
		}

		if (packages) {
			packageProvider.refresh(packages);
		} else {
			packageProvider.refresh([]);
		}
	});

	vscode.commands.registerCommand('packageDeploymentManagement.refreshEntry', () => {
		packageDeploymentProvider.refresh(BpmToolkit.Instance.packageDeploymentManager.getItems());
	});

}

// This method is called when your extension is deactivated
export function deactivate() { }