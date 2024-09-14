import * as vscode from 'vscode';
import { queueItem, serverSettings, packageSettings } from '../interfaces';

export class QueuePackagesProvider implements vscode.TreeDataProvider<queueItem>{

    private _onDidChangeTreeData: vscode.EventEmitter<queueItem | undefined | void> = new vscode.EventEmitter<queueItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<queueItem | undefined | void> = this._onDidChangeTreeData.event;

    private _queueItems!: queueItem[];

    refresh(items: queueItem[]): void {
		this._queueItems = items;
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: queueItem): vscode.TreeItem {
		var treeItem = new queueTreeItem(
			element.package.folderName,
			element.environment,
            element.package,
			element.isRunning,
			vscode.TreeItemCollapsibleState.None
		);

		return treeItem;
	}

    getChildren(): Thenable<queueItem[]> {
		if (!this._queueItems) {
			return Promise.resolve([]);
		}

		return Promise.resolve(this._queueItems);
	}
}

export class queueTreeItem extends vscode.TreeItem {
	constructor(
		public readonly name: string,
		public readonly environment: serverSettings,
        public readonly pkg: packageSettings,
		public readonly isRunning: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public contextValue: string = 'queueTreeItem'
	) {
		super(name, collapsibleState);
	}
}