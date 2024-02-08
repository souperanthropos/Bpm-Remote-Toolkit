import * as vscode from 'vscode';
import * as path from 'path';

import { serverSettings } from './interfaces';

export class EnvironmentsProvider implements vscode.TreeDataProvider<serverSettings> {

	private _onDidChangeTreeData: vscode.EventEmitter<serverSettings | undefined | void> = new vscode.EventEmitter<serverSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<serverSettings | undefined | void> = this._onDidChangeTreeData.event;

	private _servers: serverSettings[] | undefined;

	refresh(): void {
		const serverConfig = vscode.workspace.getConfiguration('cwSettings');
		this._servers = serverConfig.get<serverSettings[]>('cwEnvironments');
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: serverSettings): vscode.TreeItem {
		return new serverTreeItem(
			element.id,
			element.id,
			element.isEnable,
			vscode.TreeItemCollapsibleState.None
		  );
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
	  public readonly contextValue: string = 'serverTreeItem'
	) {
	  super(name, collapsibleState);
	  if(enable){
		this.iconPath = new vscode.ThemeIcon('device-desktop', new vscode.ThemeColor("bpmsoftEnvironment.enable"));
	  }else{
		this.iconPath = new vscode.ThemeIcon('device-desktop', new vscode.ThemeColor("bpmsoftEnvironment.disable"));
	  }
	}
  }