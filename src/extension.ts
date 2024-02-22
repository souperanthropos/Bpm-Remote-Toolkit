// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

import { EnvironmentsProvider } from './environments';
import { GitHelper } from './git';
import { serverSettings } from './interfaces';
import { PackageManager } from './packagemanager';
import { Constants } from './constants';

let terminalLog: vscode.OutputChannel;
let terminal: vscode.Terminal;
let environments: serverSettings[] | undefined;

const execShell = (cmd: string) =>
	new Promise<string>((resolve, reject) => {
		cp.exec(cmd, (err, out) => {
			if (err) {
				return reject(err);
			}
			return resolve(out);
		});
	});

function checkWorkspaceSettings() {
	const serverConfig = vscode.workspace.getConfiguration('cwSettings');
	environments = serverConfig.get<serverSettings[]>('cwEnvironments');

	if (environments && environments.length > 0) {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', true);
	} else {
		vscode.commands.executeCommand('setContext', 'isShowContextMenu', false);
	}

	vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
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

	const extensionPath = context.extensionPath;

	const gitHelper = new GitHelper(terminalLog);
	const pm = new PackageManager(terminalLog, extensionPath);

	const environmentsProvider = new EnvironmentsProvider();
	vscode.window.registerTreeDataProvider('bpmsoftEnvironments', environmentsProvider);

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

	context.subscriptions.push(vscode.commands.registerCommand('clio.openSettings', () => {
		terminal.show(true);
		terminal.sendText("clear \n clio open-settings");
		terminalLog.appendLine('Open settings...');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.restart', (server: serverSettings) => {
		if (!server.isEnable) {
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			);
		} else {
			terminal.show(true);
			terminal.sendText(
				"clear \n clio restart-web-app "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.redis.clear', (server: serverSettings) => {
		if (!server.isEnable) {
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			);
		} else {
			terminal.show(true);
			terminal.sendText(
				"clear \n clio clear-redis-db "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.compileConfiguration', (server: serverSettings) => {
		if (!server.isEnable) {
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			);
		} else {
			terminal.show(true);
			terminal.sendText(
				"clear \n clio compile-configuration "
				+ server.id);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.register', async (server: serverSettings) => {
		const loginQuery = await vscode.window.showInputBox({
			placeHolder: "Login",
			prompt: "Enter login for connecting to Bpmsoft"
		});
		if (loginQuery !== '') {
			const passwordQuery = await vscode.window.showInputBox({
				placeHolder: "Password",
				prompt: "Enter password for connecting to Bpmsoft",
				password: true
			});
			if (passwordQuery !== '') {
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Window,
						title: 'Server registration'
					},
					async progress => {
						try {
							terminalLog.show(true);

							let result = await execShell(
								"clio reg-web-app "
								+ server.id
								+ " -u " + server.url
								+ " -l " + loginQuery
								+ " -p " + passwordQuery);
							terminalLog.appendLine('Result: ' + result);

							result = await execShell(
								"clio ping "
								+ server.id);
							terminalLog.appendLine('Result: ' + result);

							context.globalState.update(server.id, true);
							vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
						} catch (error) {
							terminalLog.appendLine('' + error);

							let result = await execShell(
								"clio unreg-web-app "
								+ server.id);
							context.globalState.update(server.id, false);
							vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
						}
					}
				);
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('bpmsoftEnvironments.unregister', async (server: serverSettings) => {
		const result = await execShell(
			"clio unreg-web-app "
			+ server.id);
		terminalLog.appendLine('Result: ' + result);
		context.globalState.update(server.id, false);
		vscode.commands.executeCommand('bpmsoftEnvironments.refreshEntry');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.create', async (uri: vscode.Uri) => {
		console.log(uri.fsPath);
		const path = require("path");
		const config = vscode.workspace.getConfiguration('clio');
		const outputPath = config.get<string>('outputPath');

		if (environments) {
			const branches = environments.map(({ gitBranchName }) => gitBranchName ?? '');

			if (await gitHelper.isPermittedBranch(branches)) {
				if (await pm.createPackage(uri.fsPath)) {
					if (outputPath) {
						vscode.env.openExternal(vscode.Uri.file(outputPath));
					}
				} else {
					const buttonShowLog = "Show log file";
					vscode.window.showInformationMessage('Create package failed', buttonShowLog)
						.then(selection => {
							if (selection === buttonShowLog) {
								const folderUri = vscode.Uri.file(extensionPath + Constants.executeLogFileName);
								vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
							}
						});
				}
			}
		} else {
			vscode.window.showInformationMessage(
				"Command execute failed: check you .code-workspace file."
			);
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		checkWorkspaceSettings();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cliowrapper.package.createandsend', (uri: vscode.Uri) => {
		console.log(uri.fsPath);

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
					if (await gitHelper.checkBranch(serverConfig.gitBranchName)) {
						if (await pm.createPackage(uri.fsPath)) {
							if (!await pm.pushPackage({ targetFolderPath: uri.fsPath, targetEnviroment: serverConfig.id })) {
								const buttonShowLog = "Show log file";
								vscode.window.showInformationMessage('Send package failed', buttonShowLog)
									.then(selection => {
										if (selection === buttonShowLog) {
											const folderUri = vscode.Uri.file(extensionPath + Constants.executeLogFileName);
											vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
										}
									});
							}
						}
					}
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