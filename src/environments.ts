import * as vscode from 'vscode';
import * as path from 'path';

import { serverSettings } from './interfaces';

export class EnvironmentsProvider implements vscode.TreeDataProvider<serverSettings> {

	private _onDidChangeTreeData: vscode.EventEmitter<serverSettings | undefined | void> = new vscode.EventEmitter<serverSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<serverSettings | undefined | void> = this._onDidChangeTreeData.event;

	private _servers: serverSettings[] | undefined;

	refresh(env: serverSettings[]): void {
		this._servers = env;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: serverSettings): vscode.TreeItem {
		var treeItem = new serverTreeItem(
			element.id,
			element.id,
			element.isEnable,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.contextValue += element.isRegister ? 'Delete' : 'Register';
		if(!treeItem.enable){
			treeItem.iconPath = new vscode.ThemeIcon('vm-outline', new vscode.ThemeColor("bpmsoftEnvironment.disable"));
		}else if(element.isRegister){
			treeItem.iconPath = new vscode.ThemeIcon('vm-active', new vscode.ThemeColor("bpmsoftEnvironment.enable"));
		}else{
			treeItem.iconPath = new vscode.ThemeIcon('vm', new vscode.ThemeColor("bpmsoftEnvironment.enable"));
		}
		return treeItem;
	}

	getChildren(element?: serverSettings): Thenable<serverSettings[]> {
		if (!this._servers) {
			return Promise.resolve([]);
		}

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