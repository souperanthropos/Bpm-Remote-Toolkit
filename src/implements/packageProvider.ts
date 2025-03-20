import * as vscode from 'vscode';
import { isMatchingWorkspace, isNullOrWhitespace } from '../constants';
import { PackageSettings } from '../common/packageSettings';

export class PackageProvider implements vscode.TreeDataProvider<PackageSettings>, vscode.TreeDragAndDropController<PackageSettings> {
	dropMimeTypes = ['application/vnd.code.tree.packagesExplorer', 'application/vnd.code.tree.packageDeploymentManagement'];
	dragMimeTypes = ['application/vnd.code.tree.packagesExplorer', 'application/vnd.code.tree.packageDeploymentManagement'];

	private _onDidChangeTreeData: vscode.EventEmitter<PackageSettings | undefined | void> = new vscode.EventEmitter<PackageSettings | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PackageSettings | undefined | void> = this._onDidChangeTreeData.event;

	private readonly _packages: PackageSettings[];

	constructor(){
		this._packages = new Array<PackageSettings>();
	}

	private clear() {
		while (this._packages.length > 0) {
			this._packages.pop();
		}
	}

	handleDrag?(source: readonly PackageSettings[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Thenable<void> | void {
		dataTransfer.set('application/vnd.code.tree.packagesExplorer', new vscode.DataTransferItem(source));
	}

	refresh(folderPaths: string[]): void {
		this.clear();
		folderPaths.forEach(folderPath => {
			if(!isNullOrWhitespace(folderPath)){
				const pkg = new PackageSettings(folderPath);
				this._packages.push(pkg);
			}
		});
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PackageSettings): vscode.TreeItem {
		var treeItem = new packageTreeItem(
			element.folderName,
			element.targetFolderPath,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.tooltip = element.targetFolderPath;
		if (isMatchingWorkspace(element.targetFolderPath)) {
			treeItem.contextValue += 'Enable';
			treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("bpmEnvironment.enable"));
		} else {
			treeItem.contextValue += 'Disable';
			treeItem.iconPath = new vscode.ThemeIcon('package', new vscode.ThemeColor("bpmEnvironment.disable"));
		}

		return treeItem;
	}

	getChildren(): Thenable<PackageSettings[]> {
		return Promise.resolve(this._packages.sort((p1, p2) => {
			if (p1.folderName > p2.folderName) {
				return 1;
			}

			if (p1.folderName < p2.folderName) {
				return -1;
			}

			return 0;
		}));
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