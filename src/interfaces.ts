export interface packageSettings {
	folderName: string;
	targetFolderPath: string;
	targetEnviroment: string | undefined;
}

export interface serverSettings {
	id: string;
    url: string | undefined;
	isNetCore: boolean;
    gitBranchName: string | undefined;
    isEnable: boolean;
	isRegister: boolean;
}

export interface queueItem {
	environment: serverSettings;
	package: packageSettings;
	isRunning: boolean;
	Completed: { isSuccess: boolean } | null
}

export interface IWebAppCommandExecutor {
	webAppRegister(server: serverSettings): Promise<boolean>,
	webAppUnregister(server: serverSettings): Promise<boolean>,
	webAppPing(server: serverSettings): Promise<boolean>,
	webAppRestart(server: serverSettings): Promise<boolean>,
	clearRedisDb(server: serverSettings): Promise<boolean>,
	compileConfiguration(server: serverSettings): Promise<boolean>
}

export interface IWrapperCommandExecutor extends IWebAppCommandExecutor {
	openSettings(): void,
	getLastExecuteLogPath(): string
}

export interface IPackageCommandExecutor {
	createPackage(targetFolderPath: string, fullPathFile: string): Promise<boolean>,
	pushPackage(packageFilePath: string, targetEnviroment: string): Promise<boolean>
}