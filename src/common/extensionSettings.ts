import { FolderType } from '../constants';
import { enviromentSettings } from '../interfaces';

export class ExtensionSettings {
	private static readonly workDir = 'temp';
	private static readonly pkgDir = 'packages';
	private static readonly logDir = 'logs';

	static autoUpdateTime = false;
	static packToZip = false;
	static terminalName = 'bpmtoolkit';
	static extensionPath = '';
	static environments: enviromentSettings[] | undefined;

	public static outputPath(folderType: FolderType): string {
		const workPath = `${this.extensionPath}\\${this.workDir}`;
		switch(folderType) {
			case FolderType.terminal:
				return `${workPath}\\${this.logDir}`;
			case FolderType.package:
				return `${workPath}\\${this.pkgDir}`;
			default:
				return workPath; 

		}
	}
}