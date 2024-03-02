// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { EnvironmentsProvider } from './environments';
import { PackageProvider } from './packageExplorer';
import { GitHelper } from './git';
import { packageSettings, serverSettings } from './interfaces';
import { PackageManager } from './managers/packagemanager';
import { Constants, getDirectoryName, hash, showErrorMessage, showInformationMessage } from './constants';
import { ClioManager } from './managers/cliomanager';

let terminalLog: vscode.OutputChannel;
let terminal: vscode.Terminal;
let environments: serverSettings[] | undefined;
const bpmPackagesPattern = `${hash}_bpmPackages`;

function checkWorkspaceSettings() {
	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	if (environments && environments.length > 0) {
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

	const gitHelper = new GitHelper(terminalLog);
	const pm = new PackageManager(terminalLog);
	const cm = new ClioManager(terminalLog);

	pm.onCommandExecuteError = (message: string, showbutton: boolean) => showErrorMessage(message, showbutton);
	pm.onCommandExecuteComplete = (message: string, showbutton: boolean) => showInformationMessage(message, showbutton);
	cm.onCommandExecuteError = (message: string, showbutton: boolean) => showErrorMessage(message, showbutton);

	const environmentsProvider = new EnvironmentsProvider();
	const packageProvider = new PackageProvider();
	vscode.window.registerTreeDataProvider('bpmsoftEnvironments', environmentsProvider);
	vscode.window.registerTreeDataProvider('packagesExplorer', packageProvider);

	vscode.commands.registerCommand('bpmsoftEnvironments.refreshEntry', () => {
		if (environments) {
			environments?.forEach(env => {
				var isReg = context.globalState.get(env.id);
				if (isReg) {
					env.isRegister = true;
				} else {
					env.isRegister = false;
				}
			});
			environmentsProvider.refresh(environments);
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
		const config = vscode.workspace.getConfiguration('clio');
		const outputPath = config.get<string>('outputPath');

		if (environments) {
			const branches = environments.map(({ gitBranchName }) => gitBranchName ?? '');
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Creating package: ${getDirectoryName(uri.fsPath)}.gz`
				},
				async () => {
					vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
					if (await gitHelper.isPermittedBranch(branches)) {
						if (await pm.createPackage(uri.fsPath)) {
							if (outputPath) {
								vscode.env.openExternal(vscode.Uri.file(outputPath));
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
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.createandsend', (uri: vscode.Uri) => {
		const currentBranch = gitHelper.getCurrentBranch();
		if (environments && currentBranch !== '') {
			const arr = environments.filter(e => e.gitBranchName === currentBranch && e.isEnable && e.isRegister)?.map(({ id }) => id);
			const quickPickItems = arr.map(item => ({ label: item, iconPath: new vscode.ThemeIcon('device-desktop') }));
			const qp = vscode.window.createQuickPick();
			qp.canSelectMany = false;
			qp.items = quickPickItems;
			qp.onDidChangeSelection(async selection => {
				const serverId = selection[0].label;
				const serverConfig = environments?.find(e => e.id === serverId);
				qp.hide();

				if (serverConfig && serverConfig.gitBranchName) {
					vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: 'Current operation'
						},
						async (progress) => {
							vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
							if (await gitHelper.checkBranch(serverConfig.gitBranchName!)) {
								var folderName = getDirectoryName(uri.fsPath);
								progress.report({
									message: `creating package ${folderName}.gz`
								});
								if (await pm.createPackage(uri.fsPath)) {
									progress.report({
										message: `sending package ${folderName}.gz`,
										increment: 50
									});
									await pm.pushPackage(
										{
											folderName: folderName,
											targetFolderPath: uri.fsPath,
											targetEnviroment: serverConfig.id
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
	}));
}

// This method is called when your extension is deactivated
export function deactivate() { }