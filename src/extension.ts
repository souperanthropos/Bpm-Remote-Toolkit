// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

import { EnvironmentsProvider } from './implements/environmentsProvider';
import { PackageProvider } from './implements/packageProvider';
import { PackageDeploymentProvider } from './implements/packageDeploymentProvider';
import { enviromentSettings } from './interfaces';
import { hash, isNullOrWhitespace } from './constants';
import { BpmToolkit } from './bpmtoolkit';
import { ExtensionManager } from './managers/extensionManager';
import { PackageSettings } from './common/packageSettings';
import { BpmnViewer } from './addons/bpmn/bpmn-viewer';
import { ConnectionConfig, EntitySchemaRequestManager } from './managers/entitySchemaRequestManager';

const bpmPackagesPattern = `${hash()}_bpmPackages`;

function registerButtonCommands(context: vscode.ExtensionContext, bpmToolkit: BpmToolkit) {

	// #region buttons for Package Explorer

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.createPackageWithProgress', (pkg: PackageSettings) => {
		bpmToolkit.packageDeploymentManager.createPackageWithProgress(pkg);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.deployPackageToSelectedServer', async (pkg: PackageSettings) => {
		bpmToolkit.packageDeploymentManager.addQueueItem(pkg, true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.openLastLog', () => {
		bpmToolkit.extensionManager.openExecuteLog();
	}));

	// #endregion

	// #region buttons for Server in BPM Environments

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmEnvironments.openSettings',
		() => bpmToolkit.webAppManager.openSettings()));

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
						await bpmToolkit.webAppManager.webAppUnregister(server);
						context.globalState.update(server.id, false);
					}
					vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
				}
			}
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmEnvironments.server.unregister', async (server: enviromentSettings) => {
		await bpmToolkit.extensionManager.clearExecuteLogs();
		await bpmToolkit.webAppManager.webAppUnregister(server);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmEnvironments.refreshEntry');
	}));

	// #endregion

	// #region buttons for Package Deployment Management

	context.subscriptions.push(vscode.commands.registerCommand('packageDeploymentManagement.startDeployment', async () => {
		bpmToolkit.packageDeploymentManager.startDeployment();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packageDeploymentManagement.clear',
		() => bpmToolkit.packageDeploymentManager.clear()
	));

	// #endregion
}

function registerContextMenus(context: vscode.ExtensionContext, bpmToolkit: BpmToolkit) {

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
		if (allSelections !== undefined) {
			bpmToolkit.packageDeploymentManager.addQueueItems(allSelections);
		} else {
			bpmToolkit.packageDeploymentManager.addQueueItem(contextSelection, false);
		}
	}));

	// #endregion

	// #region context menu for Server in BPM Environments

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
	const bpmToolkit = new BpmToolkit(extensionManager);

	registerButtonCommands(context, bpmToolkit);
	registerContextMenus(context, bpmToolkit);

	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	const packageDeploymentProvider = new PackageDeploymentProvider();

	let requestManager: EntitySchemaRequestManager;

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

		if (packages.length > 0 && packages[0].targetFolderPath) {
			for (let i = 0; i < packages.length; i++) {
				const item = packages[i].targetFolderPath;
				packages[i] = item;
			}
			context.globalState.update(bpmPackagesPattern, packages);
		}

		packageProvider.refresh(packages);
	});

	vscode.commands.registerCommand('packageDeploymentManagement.refreshEntry', () => {
		packageDeploymentProvider.refresh(bpmToolkit.packageDeploymentManager.getItems());
	});

	vscode.commands.registerCommand('bpmnViewer.requestLogin', async (isForce: boolean) => {
		let conectionConfig = context.globalState.get<ConnectionConfig>('bpmnViewerConnectionConfig1');
		if (isForce || !conectionConfig) {
			const options: vscode.MessageOptions = { modal: true };
			vscode.window
				.showInformationMessage('Correct display of business process parameters requires connection to the application', options, "Connect")
				.then(async answer => {
					if (answer === "Connect") {
						conectionConfig = {
							host: '',
							username: '',
							password: ''
						};
						const host = await vscode.window.showInputBox({
							placeHolder: "Host",
							prompt: "Enter host address for connecting to Bpmsoft"
						});
						if (!isNullOrWhitespace(host)) {
							const login = await vscode.window.showInputBox({
								placeHolder: "Login",
								prompt: "Enter login for connecting to Bpmsoft"
							});
							if (!isNullOrWhitespace(login)) {
								const password = await vscode.window.showInputBox({
									placeHolder: "Password",
									prompt: "Enter password for connecting to Bpmsoft",
									password: true
								});
								if (!isNullOrWhitespace(password)) {
									conectionConfig = {
										host: host!,
										username: login!,
										password: password!
									};
								}
							}
							context.globalState.update('bpmnViewerConnectionConfig1', conectionConfig);
							requestManager = new EntitySchemaRequestManager(conectionConfig);
						}
					}
				});
		}
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('bpmnViewer.startRender', async (document: vscode.TextDocument) => {
			if(document){
				const conectionConfig = context.globalState.get<ConnectionConfig>('bpmnViewerConnectionConfig1');
				if(conectionConfig && requestManager === undefined){
					requestManager = new EntitySchemaRequestManager(conectionConfig);
				}
				const bpmnViewer = new BpmnViewer(context, document, requestManager);
				await bpmnViewer.renderDiagram();
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
