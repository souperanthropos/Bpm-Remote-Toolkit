// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { EnvironmentsProvider } from './environments';
import { PackageExplorer, PackageProvider } from './packageExplorer';
import { packageSettings, serverSettings } from './interfaces';
import { Constants, getDirectoryName, hash, showErrorMessage } from './constants';
import { ClioManager } from './managers/cliomanager';

let terminalLog: vscode.OutputChannel;
let terminal: vscode.Terminal;
const bpmPackagesPattern = `${hash}_bpmPackages`;

function checkWorkspaceSettings() {
	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	Constants.environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	if (Constants.environments && Constants.environments.length > 0) {
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

	Constants.extensionPath = context.extensionPath;

	const pe = new PackageExplorer(terminalLog);
	const cm = new ClioManager(terminalLog);

	cm.onCommandExecuteError = (message: string, showbutton: boolean) => showErrorMessage(message, showbutton);

	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	vscode.window.registerTreeDataProvider('bpmsoftEnvironments', environmentsProvider);
	vscode.window.registerTreeDataProvider('packagesExplorer', packageProvider);

	vscode.commands.registerCommand('bpmsoftEnvironments.refreshEntry', () => {
		if (Constants.environments) {
			Constants.environments?.forEach(env => {
				var isReg = context.globalState.get(env.id);
				if (isReg) {
					env.isRegister = true;
				} else {
					env.isRegister = false;
				}
			});
			environmentsProvider.refresh(Constants.environments);
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

	context.subscriptions.push(vscode.commands.registerCommand('packagesExplorer.remove', (pkg: packageSettings) => {
		let packages = context.globalState.get<Array<packageSettings>>(bpmPackagesPattern) ?? new Array();
		if (packages.length > 0) {
			packages = packages.filter(item => { return item.folderName !== pkg.folderName; });
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
			const folderUri = vscode.Uri.file(Constants.extensionPath + Constants.executeLogFileName);
			vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
		}));

	context.subscriptions.push(vscode.commands.registerCommand(
		'clio.openSettings',
		() => cm.OpenSettings()));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.restart',
		(server: serverSettings) => cm.WebAppRestart(server))
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.redis.clear',
		(server: serverSettings) => cm.ClearRedisDb(server)));

	context.subscriptions.push(vscode.commands.registerCommand(
		'bpmsoftEnvironments.compileConfiguration',
		(server: serverSettings) => cm.CompileConfiguration(server)));

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
					if (await cm.WebAppRegister(server)) {
						progress.report({
							message: 'check credential',
							increment: 50
						});
						if (await cm.WebAppPing(server)) {
							context.globalState.update(server.id, true);
						} else {
							progress.report({
								message: 'check credential failed',
								increment: 50
							});
							await cm.WebAppUnregister(server, false);
							context.globalState.update(server.id, false);
						}
						vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
					}
				}
			);
		}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.unregister', async (server: serverSettings) => {
		await cm.WebAppUnregister(server, true);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.add.packagesExplorer', (uri: vscode.Uri) => {
		let packages = context.globalState.get<Array<packageSettings>>(bpmPackagesPattern) ?? new Array();
		const newPackage: packageSettings = {
			folderName: getDirectoryName(uri.fsPath),
			targetFolderPath: uri.fsPath,
			targetEnviroment: undefined
		};
		if (!packages.find(p => p.targetFolderPath === uri.fsPath)) {
			packages.push(newPackage);
			context.globalState.update(bpmPackagesPattern, packages);
			vscode.commands.executeCommand('packagesExplorer.refreshEntry');
		}
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