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
		vscode.commands.registerCommand('bpmnViewer.start', () => {
			const bpmnViewer = new BpmnViewer(context);
			const json = JSON.parse(`{\n  \"MetaData\": {\n    \"Schema\": {\n      \"ManagerName\": \"ProcessSchemaManager\",\n      \"UId\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n      \"A2\": \"OmniAddressBookSyncProcess\",\n      \"A5\": \"18811680-829c-46fe-bbc7-831f6aa860d4\",\n      \"B1\": [],\n      \"B2\": [],\n      \"B3\": [\n        {\n          \"UId\": \"8224cdae-8465-4ad9-b342-069b53f89bda\",\n          \"A2\": \"Terrasoft.Configuration\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"18811680-829c-46fe-bbc7-831f6aa860d4\",\n          \"GF1\": \"null\"\n        }\n      ],\n      \"B6\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n      \"B8\": \"7.15.4.3055\",\n      \"FJ1\": [],\n      \"IJ1\": true,\n      \"BK8\": \"bb4d6607-026b-4b27-b640-8f5c77c1e89d\",\n      \"IJ10\": true,\n      \"BK15\": [],\n      \"BK37\": {\n        \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaParameter\",\n        \"UId\": \"cdd58be7-2dba-4a5e-869b-1ad5d6d7513a\",\n        \"A2\": \"NotificationCaption\",\n        \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n        \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n        \"L1\": \"8b3f29bb-ea14-4ce5-a5c5-293a929b6ba2\",\n        \"L8\": {\n          \"GS1\": 3,\n          \"GS2\": \"[#[PropertyValue:Caption]#]\"\n        }\n      },\n      \"BK1\": \"FFFFFFFF\",\n      \"BK2\": \"FFBBBBBB\",\n      \"BK3\": [\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaLaneSet\",\n          \"UId\": \"44983b29-e108-4a3a-9f98-a65f767ab5c6\",\n          \"A2\": \"LaneSet1\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"BL7\": \"11a47caf-a0d5-41fa-a274-a0b11f77447a\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"BM1\": 0,\n          \"BM4\": [\n            {\n              \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaLane\",\n              \"UId\": \"48a0ab90-9c38-40a9-9cae-852c058b37e7\",\n              \"A2\": \"Lane1\",\n              \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n              \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n              \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n              \"IL2\": \"44983b29-e108-4a3a-9f98-a65f767ab5c6\",\n              \"BL7\": \"abcd74b9-5912-414b-82ac-f1aa4dcd554e\",\n              \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n              \"CD1\": [],\n              \"CD2\": [],\n              \"CD4\": \"44983b29-e108-4a3a-9f98-a65f767ab5c6\",\n              \"CD7\": []\n            }\n          ]\n        }\n      ],\n      \"BK5\": [],\n      \"BK4\": [\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaStartEvent\",\n          \"UId\": \"87308db8-3a9f-4f1e-84fa-8be7d0947505\",\n          \"A2\": \"StartEvent1\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"IL2\": \"48a0ab90-9c38-40a9-9cae-852c058b37e7\",\n          \"IL3\": true,\n          \"BL3\": \"145;184\",\n          \"BL7\": \"53818048-7868-48f6-ada0-0ebaa65af628\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"BN2\": \"27;27\",\n          \"BO3\": true,\n          \"FC1\": [],\n          \"ED1\": false\n        },\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaTerminateEvent\",\n          \"UId\": \"630281e5-4193-486e-a9c6-788be957eb70\",\n          \"A2\": \"TerminateEvent1\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"IL2\": \"48a0ab90-9c38-40a9-9cae-852c058b37e7\",\n          \"BL3\": \"489;184\",\n          \"BL7\": \"1bd93619-0574-454e-bb4e-cf53b9eb9470\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"BN2\": \"27;27\",\n          \"BO3\": true,\n          \"FC1\": []\n        },\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaScriptTask\",\n          \"UId\": \"f2099f78-b069-48c0-80f1-ed31ada89f0a\",\n          \"A2\": \"ScriptTask1\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"IL2\": \"48a0ab90-9c38-40a9-9cae-852c058b37e7\",\n          \"BL3\": \"289;170\",\n          \"BL7\": \"0e490dda-e140-4441-b600-6f5c64d024df\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"BN2\": \"69;55\",\n          \"BO3\": true,\n          \"BP2\": [],\n          \"CL2\": \"FFFFFFFF\",\n          \"CH1\": \"SyncAddressBook();\\nreturn true;\",\n          \"CH2\": true\n        },\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaSequenceFlow\",\n          \"UId\": \"3c377929-4f69-4f7f-85a9-83812b532e19\",\n          \"A2\": \"SequenceFlow1\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"BL7\": \"0d8351f6-c2f4-4737-bdd9-6fbfe0837fec\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"CI1\": \"87308db8-3a9f-4f1e-84fa-8be7d0947505\",\n          \"CI2\": \"f2099f78-b069-48c0-80f1-ed31ada89f0a\",\n          \"CI3\": \"null\",\n          \"CI5\": \"FF939598\",\n          \"CI6\": 1,\n          \"CI11\": \"172;198\",\n          \"CI12\": \"289;198\"\n        },\n        {\n          \"BL1\": \"Terrasoft.Core.Process.ProcessSchemaSequenceFlow\",\n          \"UId\": \"20db6e71-fe3e-4240-bdbb-22b057114158\",\n          \"A2\": \"SequenceFlow2\",\n          \"A3\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A4\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"A5\": \"2d5fc1de-3e79-43a1-a942-0c11b5f63ba2\",\n          \"BL7\": \"0d8351f6-c2f4-4737-bdd9-6fbfe0837fec\",\n          \"BL8\": \"1c23f488-58aa-41f3-b39c-517c094ac848\",\n          \"CI1\": \"f2099f78-b069-48c0-80f1-ed31ada89f0a\",\n          \"CI2\": \"630281e5-4193-486e-a9c6-788be957eb70\",\n          \"CI3\": \"null\",\n          \"CI5\": \"FF939598\",\n          \"CI6\": 1,\n          \"CI11\": \"358;198\",\n          \"CI12\": \"489;198\"\n        }\n      ],\n      \"BK9\": [],\n      \"BK18\": \"Business Process\",\n      \"BK29\": true,\n      \"BK30\": true,\n      \"BK32\": \"public void SyncAddressBook()\\n{\\n\\tvar manager = new OmniAddressBookManager(UserConnection);\\n\\tmanager.LdapSyncAddressBookSection();\\n}\",\n      \"BK34\": \"null\",\n      \"BK24\": []\n    }\n  }\n}`);
			bpmnViewer.convertToBPMN(json);
		})
	  );
	vscode.commands.executeCommand('bpmnViewer.start');
}

// This method is called when your extension is deactivated
export function deactivate() { }