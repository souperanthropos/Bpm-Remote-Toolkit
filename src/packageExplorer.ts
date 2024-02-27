import * as vscode from 'vscode';
import { packageSettings } from './interfaces';

export class PackageProvider implements vscode.TreeDataProvider<packageSettings> {
	private _onDidChangeTreeData: vscode.EventEmitter<packageSettings | undefined | void> = new vscode.EventEmitter<packageSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<packageSettings | undefined | void> = this._onDidChangeTreeData.event;

	private _packages: packageSettings[] | undefined;

    refresh(env: packageSettings[]): void {
		this._packages = env;
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: packageSettings): vscode.TreeItem {
		var treeItem = new packageTreeItem(
            element.folderName,
			element.targetFolderPath,
			vscode.TreeItemCollapsibleState.None
		);

		return treeItem;
	}

    getChildren(): Thenable<packageSettings[]> {
		if (!this._packages) {
			return Promise.resolve([]);
		}

		return Promise.resolve(this._packages);
	}
}

export class packageTreeItem extends vscode.TreeItem {
	constructor(
	  public readonly name: string,
	  public readonly folderPath: string,
	  public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	  public contextValue: string = 'packageTreeItem'
	) {
	  super(name, collapsibleState);
	}
  }