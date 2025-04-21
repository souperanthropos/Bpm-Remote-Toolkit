// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

import { EnvironmentsProvider } from './implements/environmentsProvider';
import { PackageProvider } from './implements/packageProvider';
import { PackageDeploymentProvider } from './implements/packageDeploymentProvider';
import { enviromentSettings } from './interfaces';
import { hash, jsonToBpmn } from './constants';
import { BpmToolkit } from './bpmtoolkit';
import { ExtensionManager } from './managers/extensionManager';
import { PackageSettings } from './common/packageSettings';
import { BpmnViewer } from './bpmn-viewer';

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

function registerContextMenus(context: vscode.ExtensionContext, bpmToolkit: BpmToolkit){

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
			bpmToolkit.packageDeploymentManager.addQueueItems(allSelections);
		}else{
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
		packageDeploymentProvider.refresh(bpmToolkit.packageDeploymentManager.getItems());
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('bpmnViewer.start', async () => {
			const json = JSON.parse(`{ \"MetaData\": { \"Schema\": { \"ManagerName\": \"ProcessSchemaManager\", \"UId\": \"f9934026-b031-467e-8547-13dff947d860\", \"A2\": \"OmniProcess577ae732\", \"A5\": \"af2b71ef-e323-410f-9017-8059bfda38c8\", \"B1\": [], \"B2\": [], \"B3\": [], \"B6\": \"a00051f4-cde3-4f3f-b08e-c5ad1a5c735a\", \"B8\": \"7.15.4.3055\", \"FJ1\": [], \"IJ1\": true, \"BK8\": \"bb4d6607-026b-4b27-b640-8f5c77c1e89d\", \"IJ10\": true, \"BK15\": [], \"BK37\": { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaParameter\", \"UId\": \"cdd58be7-2dba-4a5e-869b-1ad5d6d7513a\", \"A2\": \"NotificationCaption\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"L1\": \"8b3f29bb-ea14-4ce5-a5c5-293a929b6ba2\", \"L8\": { \"GS1\": 3, \"GS2\": \"[#[PropertyValue:Caption]#]\" } }, \"BK1\": \"FFFFFFFF\", \"BK2\": \"FFBBBBBB\", \"BK3\": [ { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaLaneSet\", \"UId\": \"e8b420fc-68ab-41b2-91f5-af7b06ebcaf9\", \"A2\": \"LaneSet1\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"A5\": \"419e2d9e-74cb-4205-a81d-e59ad71f4500\", \"BL7\": \"11a47caf-a0d5-41fa-a274-a0b11f77447a\", \"BL8\": \"f9934026-b031-467e-8547-13dff947d860\", \"BM4\": [ { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaLane\", \"UId\": \"245b07af-f3b2-4849-ae2a-3381c06b4013\", \"A2\": \"Lane1\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"A5\": \"419e2d9e-74cb-4205-a81d-e59ad71f4500\", \"IL2\": \"e8b420fc-68ab-41b2-91f5-af7b06ebcaf9\", \"BL7\": \"abcd74b9-5912-414b-82ac-f1aa4dcd554e\", \"BL8\": \"f9934026-b031-467e-8547-13dff947d860\", \"CD1\": [], \"CD2\": [], \"CD4\": \"e8b420fc-68ab-41b2-91f5-af7b06ebcaf9\", \"CD7\": [] } ] } ], \"BK5\": [], \"BK4\": [ { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaStartEvent\", \"UId\": \"5ed70c05-bc3b-41ab-b42a-9bacc78a90b1\", \"A2\": \"StartEvent1\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"A5\": \"419e2d9e-74cb-4205-a81d-e59ad71f4500\", \"IL2\": \"245b07af-f3b2-4849-ae2a-3381c06b4013\", \"BL3\": \"50;184\", \"BL7\": \"53818048-7868-48f6-ada0-0ebaa65af628\", \"BL8\": \"f9934026-b031-467e-8547-13dff947d860\", \"BN2\": \"27;27\", \"BO3\": true, \"FC1\": [] }, { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaTerminateEvent\", \"UId\": \"704b58c5-9992-412b-b1d2-f694e40b1161\", \"A2\": \"TerminateEvent1\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"A5\": \"419e2d9e-74cb-4205-a81d-e59ad71f4500\", \"IL2\": \"245b07af-f3b2-4849-ae2a-3381c06b4013\", \"BL3\": \"600;184\", \"BL7\": \"1bd93619-0574-454e-bb4e-cf53b9eb9470\", \"BL8\": \"f9934026-b031-467e-8547-13dff947d860\", \"BN2\": \"27;27\", \"BO3\": true, \"FC1\": [] }, { \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaSequenceFlow\", \"UId\": \"22a654af-d023-439a-b1d0-02d477a6bb76\", \"A2\": \"SequenceFlow1\", \"A3\": \"f9934026-b031-467e-8547-13dff947d860\", \"A4\": \"f9934026-b031-467e-8547-13dff947d860\", \"A5\": \"419e2d9e-74cb-4205-a81d-e59ad71f4500\", \"BL7\": \"0d8351f6-c2f4-4737-bdd9-6fbfe0837fec\", \"BL8\": \"f9934026-b031-467e-8547-13dff947d860\", \"CI1\": \"5ed70c05-bc3b-41ab-b42a-9bacc78a90b1\", \"CI2\": \"704b58c5-9992-412b-b1d2-f694e40b1161\", \"CI3\": \"null\", \"CI5\": \"FF939598\", \"CI6\": 1 } ], \"BK9\": [], \"BK18\": \"Business Process\", \"BK29\": true, \"BK30\": true, \"BK34\": \"ru-RU\", \"BK24\": [] } } }`);
			const xml = await jsonToBpmn(json);
			const bpmnViewer = new BpmnViewer(context, xml);
		})
	  );
	vscode.commands.executeCommand('bpmnViewer.start');
}

// This method is called when your extension is deactivated
export function deactivate() { }
