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
}

export interface queueItem {
	package: packageSettings;
	isRunning: boolean;
	Completed: { isSuccess: boolean } | null
}

export interface IWebAppCommandExecutor {
	webAppRegister(server: enviromentSettings): Promise<boolean>,
	webAppUnregister(server: enviromentSettings): Promise<boolean>,
	webAppPing(server: enviromentSettings): Promise<boolean>,
	webAppRestart(server: enviromentSettings): Promise<boolean>,
	clearRedisDb(server: enviromentSettings): Promise<boolean>,
	compileConfiguration(server: enviromentSettings): Promise<boolean>
}

export interface IWrapperCommandExecutor extends IWebAppCommandExecutor {
	openSettings(): void,
	getLastExecuteLogPath(): string
}

export interface IPackageCommandExecutor {
	createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean>,
	pushPackage(pkg: packageSettings): Promise<boolean>
}