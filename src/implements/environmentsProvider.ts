import * as vscode from 'vscode';
import { enviromentSettings } from '../interfaces';

export class EnvironmentsProvider implements vscode.TreeDataProvider<enviromentSettings> {

	private _onDidChangeTreeData: vscode.EventEmitter<enviromentSettings | undefined | void> = new vscode.EventEmitter<enviromentSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<enviromentSettings | undefined | void> = this._onDidChangeTreeData.event;

	private _servers: enviromentSettings[] = [];

	refresh(env: ReadonlyArray<enviromentSettings>): void {
		this._servers = Array.from(env);
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: enviromentSettings): vscode.TreeItem {
		var treeItem = new serverTreeItem(
			`${element.id} - ${element.url}`,
			element.id,
			element.isEnable,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.contextValue += element.isRegister ? 'Unregister' : 'Register';
		if (!treeItem.enable) {
			treeItem.iconPath = new vscode.ThemeIcon('vm-outline', new vscode.ThemeColor("bpmEnvironment.disable"));
		} else if (element.isRegister) {
			treeItem.iconPath = new vscode.ThemeIcon('vm-active', new vscode.ThemeColor("bpmEnvironment.enable"));
		} else {
			treeItem.iconPath = new vscode.ThemeIcon('vm', new vscode.ThemeColor("bpmEnvironment.enable"));
		}
		return treeItem;
	}

	getChildren(): Thenable<enviromentSettings[]> {
		return Promise.resolve(this._servers);
	}
}

export class serverTreeItem extends vscode.TreeItem {
	constructor(
		public readonly name: string,
		public readonly id: string,
		public readonly enable: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public contextValue: string = 'serverTreeItem'
	) {
		super(name, collapsibleState);
	}
}