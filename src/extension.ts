// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

import { PackageExplorer } from './packageExplorer';
import { EnvironmentsProvider } from './implements/environmentsProvider';
import { PackageProvider } from './implements/packageProvider';
import { packageSettings, serverSettings } from './interfaces';
import { ExtensionSettings, getDirectoryName, hash, showErrorMessage } from './constants';
import { ClioCommandExecutor } from './implements/clioCommandExecutor';
import { FileManager } from './managers/filemanager';
import { WebAppManager } from './managers/webappmanager';

let terminalLog: vscode.OutputChannel;
let terminal: vscode.Terminal;
const bpmPackagesPattern = `${hash()}_bpmPackages`;

function checkWorkspaceSettings() {
	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	ExtensionSettings.environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	if (ExtensionSettings.environments && ExtensionSettings.environments.length > 0) {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
	} else {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
	}

	vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	vscode.commands.executeCommand('packagesExplorer.refreshEntry');
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	if (terminalLog === undefined) {
		terminalLog = vscode.window.createOutputChannel("cliowrapper");
	}
	if (terminal === undefined) {
		terminal = vscode.window.terminals.find(x => x.name === 'cliowrapper') ?? vscode.window.createTerminal(`cliowrapper`);
	}

	checkWorkspaceSettings();

	ExtensionSettings.extensionPath = context.extensionPath;

	const pe = new PackageExplorer(terminalLog);
	const cm = new ClioCommandExecutor(terminalLog);
	const fm = new FileManager();
	const wm = new WebAppManager(terminalLog, new ClioCommandExecutor(terminalLog));

	wm.onCommandExecuteError = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) =>
		showErrorMessage(message, showbutton, executeLogFilePath);

	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	vscode.window.registerTreeDataProvider('bpmsoftEnvironments', environmentsProvider);
	//vscode.window.registerTreeDataProvider('packagesExplorer', packageProvider);

	vscode.window.createTreeView('packagesExplorer', {
		treeDataProvider: packageProvider,
		canSelectMany: true
	});

	vscode.commands.registerCommand('bpmsoftEnvironments.refreshEntry', () => {
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

	vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		const config = vscode.workspace.getConfiguration('bpmwrapper.general');
        const isAutoUpdateTime = config.get('autoUpdateTime');
		if(isAutoUpdateTime){
			await fm.UpdateTimeInDescriptor(document);
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.remove', (contextSelection: packageSettings, allSelections: packageSettings[]) => {
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

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.create', (pkg: packageSettings) => {
		pe.create(pkg.targetFolderPath);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.createandsend', (pkg: packageSettings) => {
		pe.createAndSend(pkg.targetFolderPath);
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		checkWorkspaceSettings();
	}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'clio.openLastLog',
		() => {
			const folderUri = vscode.Uri.file(cm.getLastExecuteLogPath());
			vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
		}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'clio.openSettings',
		() => cm.openSettings()));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.restart',
		(server: serverSettings) => cm.webAppRestart(server))
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.redis.clear',
		(server: serverSettings) => cm.clearRedisDb(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.compileConfiguration',
		(server: serverSettings) => cm.compileConfiguration(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.register',
		async (server: serverSettings) => {
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'Current operation'
				},
				async (progress) => {
					progress.report({
						message: 'server registration'
					});
					if (await cm.webAppRegister(server)) {
						progress.report({
							message: 'check credential',
							increment: 50
						});
						if (await cm.webAppPing(server)) {
							context.globalState.update(server.id, true);
						} else {
							progress.report({
								message: 'check credential failed',
								increment: 50
							});
							await wm.webAppUnregister(server, false);
							context.globalState.update(server.id, false);
						}
						vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
					}
				}
			);
		}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.unregister', async (server: serverSettings) => {
		await wm.webAppUnregister(server, true);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.add.packagesExplorer', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
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

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.create', (uri: vscode.Uri) => {
		pe.create(uri.fsPath);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.createandsend', (uri: vscode.Uri) => {
		pe.createAndSend(uri.fsPath);
	}));
}

// This method is called when your extension is deactivated
export function deactivate() { }