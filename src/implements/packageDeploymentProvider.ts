import * as vscode from 'vscode';
import { queueItem, packageSettings } from '../interfaces';

export class PackageDeploymentProvider implements vscode.TreeDataProvider<queueItem>{
	
    private _onDidChangeTreeData: vscode.EventEmitter<queueItem | undefined | void> = new vscode.EventEmitter<queueItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<queueItem | undefined | void> = this._onDidChangeTreeData.event;

    private _queueItems!: queueItem[];

    refresh(items: ReadonlyArray<queueItem>): void {
		this._queueItems = items.concat();
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: queueItem): vscode.TreeItem {
		var treeItem = new queueTreeItem(
			element.package.folderName,
            element.package,
			element.isRunning,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.tooltip = element.package.targetFolderPath;
		if(element.isRunning){
			treeItem.iconPath = new vscode.ThemeIcon('loading~spin');
		}else{
			if(element.Completed){
				if(element.Completed.isSuccess){
					treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("packageDeploymentManagement.successCompleted"));
				}else{
					treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("packageDeploymentManagement.errorCompleted"));
				}
			}else{
				treeItem.iconPath = new vscode.ThemeIcon('package');
			}
		}
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
        public readonly pkg: packageSettings,
		public readonly isRunning: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public contextValue: string = 'queueTreeItem'
	) {
		super(name, collapsibleState);
	}
}