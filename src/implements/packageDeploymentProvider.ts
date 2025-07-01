import * as vscode from 'vscode';
import { queueItem } from '../interfaces';
import { PackageSettings } from '../common/packageSettings';
import { DeployNode, DeployStatus } from '../managers/packageDeploymentManager';

export class PackageDeploymentProvider implements vscode.TreeDataProvider<queueItem>, vscode.TreeDragAndDropController<queueItem> {
	dropMimeTypes = ['application/vnd.code.tree.packageDeploymentManagement', 'application/vnd.code.tree.packagesExplorer'];
	dragMimeTypes = ['application/vnd.code.tree.packageDeploymentManagement', 'application/vnd.code.tree.packagesExplorer'];

    private _onDidChangeTreeData: vscode.EventEmitter<queueItem | undefined | void> = new vscode.EventEmitter<queueItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<queueItem | undefined | void> = this._onDidChangeTreeData.event;

    //private _queueItems!: queueItem[];
	private _deployNode!: DeployNode;

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
			targetIndex = this._deployNode.packages.findIndex(q=>q === target);
		}else{
			targetIndex = this._deployNode.packages.length - 1;
		}
		treeItems.forEach(element => {
			this.itemMove(element, targetIndex);
		});
		this._onDidChangeTreeData.fire();
	}

	refresh(node: DeployNode): void {
		this._deployNode = node;
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: queueItem): vscode.TreeItem {
		let treeItem: queueTreeItem;
		if(!element.package){
			treeItem = new queueTreeItem(
				'packages.zip',
				false,
				vscode.TreeItemCollapsibleState.Expanded
			);
			treeItem.tooltip = 'packages.zip';
			switch(this._deployNode.status){
				case DeployStatus.Uploading:
					treeItem.iconPath = new vscode.ThemeIcon('loading~spin');
					break;
				case DeployStatus.Success:
					treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("packageDeploymentManagement.successCompleted"));
					break;
				case DeployStatus.Error:
					treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("packageDeploymentManagement.errorCompleted"));
					break;
				default:
					treeItem.iconPath = new vscode.ThemeIcon('package');
					break;
			}
		}else{
			treeItem = new queueTreeItem(
				element.package.packageFileName,
				element.isRunning,
				vscode.TreeItemCollapsibleState.None,
				element.package
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
		}
		return treeItem;
	}

    getChildren(element?: queueItem): Thenable<queueItem[]> {
		if (!this._deployNode) {
			return Promise.resolve([]);
		}
		if(!element && this._deployNode.packages.length > 1){
			return Promise.resolve(this._deployNode.getRootNodes());
		}
		return Promise.resolve(this._deployNode.packages);
	}

	private itemMove(element: queueItem, newIndex: number) {
		var oldIndex = this._deployNode.packages.findIndex(q=>q === element);
		this._deployNode.packages.splice(oldIndex, 1);
		this._deployNode.packages.splice(newIndex, 0, element);
	}
}

export class queueTreeItem extends vscode.TreeItem {
	constructor(
		public readonly name: string,
		public readonly isRunning: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly pkg?: PackageSettings,
		public contextValue: string = 'queueTreeItem'
	) {
		super(name, collapsibleState);
	}
}