export interface packageSettings {
	folderName: string;
	targetFolderPath: string;
	targetEnviroment: enviromentSettings | null;
}

export interface enviromentSettings {
	id: string;
    url: string | undefined;
	isNetCore: boolean;
    gitBranchName: string | undefined;
    isEnable: boolean;
	isRegister: boolean;
	postRunCommand: string | undefined
}

export interface queueItem {
	package: packageSettings;
	isRunning: boolean;
	Completed: { isSuccess: boolean } | null
}