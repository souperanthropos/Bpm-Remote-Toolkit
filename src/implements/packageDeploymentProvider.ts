import * as vscode from 'vscode';
import { queueItem } from '../interfaces';
import { PackageSettings } from '../common/packageSettings';

export class PackageDeploymentProvider implements vscode.TreeDataProvider<queueItem>, vscode.TreeDragAndDropController<queueItem> {
	dropMimeTypes = ['application/vnd.code.tree.packageDeploymentManagement', 'application/vnd.code.tree.packagesExplorer'];
	dragMimeTypes = ['application/vnd.code.tree.packageDeploymentManagement', 'application/vnd.code.tree.packagesExplorer'];

    private _onDidChangeTreeData: vscode.EventEmitter<queueItem | undefined | void> = new vscode.EventEmitter<queueItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<queueItem | undefined | void> = this._onDidChangeTreeData.event;

    private _queueItems!: queueItem[];

	handleDrag?(source: readonly queueItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Thenable<void> | void {
		dataTransfer.set('application/vnd.code.tree.packageDeploymentManagement', new vscode.DataTransferItem(source));
	}
	handleDrop?(target: queueItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Thenable<void> | void {
		const transferItem = dataTransfer.get('application/vnd.code.tree.packageDeploymentManagement');
		if (!transferItem) {
			return;
		}
		const treeItems: queueItem[] = transferItem.value;
		if (treeItems.length === 0) {
			return;
		}
		let targetIndex = 0;
		if(target !== undefined){
			targetIndex = this._queueItems.findIndex(q=>q === target);
		}else{
			targetIndex = this._queueItems.length - 1;
		}
		treeItems.forEach(element => {
			this.itemMove(element, targetIndex);
		});
		this._onDidChangeTreeData.fire();
	}

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

	private itemMove(element: queueItem, newIndex: number) {
		var oldIndex = this._queueItems.findIndex(q=>q === element);
		this._queueItems.splice(oldIndex, 1);
		this._queueItems.splice(newIndex, 0, element);
	}
}

export class queueTreeItem extends vscode.TreeItem {
	constructor(
		public readonly name: string,
        public readonly pkg: PackageSettings,
		public readonly isRunning: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public contextValue: string = 'queueTreeItem'
	) {
		super(name, collapsibleState);
	}
}