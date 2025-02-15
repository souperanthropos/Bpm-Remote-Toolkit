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

export interface IAppCommandExecutor {
	openSettings(): void
}

export interface ICommandExecutor extends IAppCommandExecutor, IWebAppCommandExecutor {}

export interface IPackageCommandExecutor {
	createPackage(pkg: packageSettings): Promise<boolean>,
	pushPackage(pkg: packageSettings): Promise<boolean>
}

export interface IPackageActions {
	createPackage(pkg: packageSettings): Promise<boolean>,
	createPackageWithProgress(pkg: packageSettings): void,
	pushPackage(pkg: packageSettings): Promise<boolean>
}