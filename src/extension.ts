// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

import { EnvironmentsProvider } from './implements/environmentsProvider';
import { PackageProvider } from './implements/packageProvider';
import { PackageDeploymentProvider } from './implements/packageDeploymentProvider';
import { packageSettings, enviromentSettings } from './interfaces';
import { ExtensionSettings, getDirectoryName, hash } from './constants';
import { BpmToolkit } from './bpmtoolkit';

const bpmPackagesPattern = `${hash()}_bpmPackages`;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	ExtensionSettings.extensionPath = context.extensionPath;

    const bpmToolkit = new BpmToolkit();
	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	const packageDeploymentProvider = new PackageDeploymentProvider();

	vscode.window.registerTreeDataProvider('bpmEnvironments', environmentsProvider);

	vscode.window.createTreeView('packagesExplorer', {
		treeDataProvider: packageProvider,
		canSelectMany: true
	});

	vscode.window.createTreeView('packageDeploymentManagement', {
		treeDataProvider: packageDeploymentProvider,
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
		let packages = context.globalState.get<Array<packageSettings>>(bpmPackagesPattern) ?? new Array();
		if (packages) {
			packageProvider.refresh(packages);
		} else {
			packageProvider.refresh([]);
		}
	});

	vscode.commands.registerCommand('packageDeploymentManagement.refreshEntry', () => {
		packageDeploymentProvider.refresh(bpmToolkit.packageDeploymentManager.getItems());
	});

	vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		if(ExtensionSettings.autoUpdateTime){
			await bpmToolkit.fileManager.UpdateTimeInDescriptor(document);
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.remove', (contextSelection: packageSettings, allSelections: packageSettings[]) => {
		let packages = context.globalState.get<Array<packageSettings>>(bpmPackagesPattern) ?? new Array();
		if (packages.length > 0) {
			if(allSelections){
				allSelections.forEach(pkg => {
					packages = packages.filter(item => { return item.folderName !== pkg.folderName; });
				});
			}else{
				packages = packages.filter(item => { return item.folderName !== contextSelection.folderName; });
			}
			context.globalState.update(bpmPackagesPattern, packages);
			vscode.commands.executeCommand('packagesExplorer.refreshEntry');
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.create', (pkg: packageSettings) => {
		bpmToolkit.packageExplorer.create(pkg.targetFolderPath);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.createAndSend', (pkg: packageSettings) => {
		bpmToolkit.packageExplorer.createAndSend(pkg.targetFolderPath);
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		bpmToolkit.checkWorkspaceSettings();
	}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.openLastLog',
		() => {
			const folderUri = vscode.Uri.file(bpmToolkit.webAppManager.getLastExecuteLogPath());
			vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
		}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.openSettings',
		() => bpmToolkit.webAppManager.openSettings()));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.restart',
		(server: enviromentSettings) => bpmToolkit.webAppManager.webAppRestart(server))
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.redisClear',
		(server: enviromentSettings) => bpmToolkit.webAppManager.clearRedisDb(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.compileConfiguration',
		(server: enviromentSettings) => bpmToolkit.webAppManager.compileConfiguration(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.server.register',
		async (server: enviromentSettings) => {
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'Current operation'
				},
				async (progress) => {
					progress.report({
						message: 'server registration'
					});
					if (await bpmToolkit.webAppManager.webAppRegister(server)) {
						progress.report({
							message: 'check credential',
							increment: 50
						});
						if (await bpmToolkit.webAppManager.webAppPing(server)) {
							context.globalState.update(server.id, true);
						} else {
							progress.report({
								message: 'check credential failed',
								increment: 50
							});
							await bpmToolkit.webAppManager.webAppUnregister(server, false);
							context.globalState.update(server.id, false);
						}
						vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
					}
				}
			);
		}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmEnvironments.server.unregister', async (server: enviromentSettings) => {
		await bpmToolkit.webAppManager.webAppUnregister(server, true);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('explorer.folder.addPackage', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
		let packages = context.globalState.get<Array<packageSettings>>(bpmPackagesPattern) ?? new Array();
		allSelections.forEach(uri => {
			if (fs.lstatSync(uri.fsPath).isDirectory()) {
				const newPackage: packageSettings = {
					folderName: getDirectoryName(uri.fsPath),
					targetFolderPath: uri.fsPath,
					targetEnviroment: undefined
				};
				if (!packages.find(p => p.targetFolderPath === uri.fsPath)) {
					packages.push(newPackage);
					context.globalState.update(bpmPackagesPattern, packages);
				}
			}
		});
		vscode.commands.executeCommand('packagesExplorer.refreshEntry');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('explorer.folder.createPackage', (uri: vscode.Uri) => {
		bpmToolkit.packageExplorer.create(uri.fsPath);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('explorer.folder.createAndSendPackage', (uri: vscode.Uri) => {
		bpmToolkit.packageExplorer.createAndSend(uri.fsPath);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.package.addDeployment', (contextSelection: packageSettings, allSelections: packageSettings[]) => {
		bpmToolkit.packageDeploymentManager.addQueueItem(contextSelection);
	}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'packageDeploymentManagement.startDeployment',
		() => bpmToolkit.packageDeploymentManager.startDeployment()));
}

// This method is called when your extension is deactivated
export function deactivate() { }