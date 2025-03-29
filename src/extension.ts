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
import { ExtensionManager } from './managers/extensionManager';
import { PackageSettings } from './common/packageSettings';

const bpmPackagesPattern = `${hash()}_bpmPackages`;

function registerButtonCommands(context: vscode.ExtensionContext, extensionManager: ExtensionManager) {

	// #region buttons for Package Explorer

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.createPackageWithProgress', (pkg: PackageSettings) => {
		BpmToolkit.Instance.packageDeploymentManager.createPackageWithProgress(pkg);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.deployPackageToSelectedServer', async (pkg: PackageSettings) => {
		await extensionManager.clearLogs();
		BpmToolkit.Instance.packageDeploymentManager.clear();
		BpmToolkit.Instance.packageDeploymentManager.addQueueItem(pkg, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.openLastLog', () => {
		const folderUri = vscode.Uri.file(extensionManager.executeLogFilePath);
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
		await extensionManager.clearLogs();
		await BpmToolkit.Instance.webAppManager.webAppUnregister(server);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
	}));

	// #endregion

	// #region buttons for Package Deployment Management

	context.subscriptions.push(vscode.commands.registerCommand('packageDeploymentManagement.startDeployment', async () => {
		await extensionManager.clearLogs();
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const extensionManager = new ExtensionManager();

	registerButtonCommands(context, extensionManager);
	registerContextMenus(context);

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
		extensionManager.environments?.forEach(env => {
			var isReg = context.globalState.get(env.id);
			if (isReg) {
				env.isRegister = true;
			} else {
				env.isRegister = false;
			}
		});
		environmentsProvider.refresh(extensionManager.environments);
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

		packageProvider.refresh(packages);
	});

	vscode.commands.registerCommand('packageDeploymentManagement.refreshEntry', () => {
		packageDeploymentProvider.refresh(BpmToolkit.Instance.packageDeploymentManager.getItems());
	});

}

// This method is called when your extension is deactivated
export function deactivate() { }