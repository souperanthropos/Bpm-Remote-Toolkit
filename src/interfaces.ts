export interface packageSettings {
	folderName: string;
	targetFolderPath: string;
	targetEnviroment: string | undefined;
}

export interface serverSettings {
	id: string;
    url: string | undefined;
    gitBranchName: string | undefined;
    isEnable: boolean;
	isRegister: boolean;
}

export interface IWebAppCommandExecutor {
	openSettings(): void,
	webAppRegister(server: serverSettings): Promise<boolean>,
	webAppUnregister(server: serverSettings, isLogEnabled: boolean): void,
	webAppPing(server: serverSettings): Promise<boolean>,
	webAppRestart(server: serverSettings): void,
	clearRedisDb(server: serverSettings): void,
	compileConfiguration(server: serverSettings): void
}

export interface IPackageCommandExecutor {
	createPackage(targetFolderPath: string): Promise<boolean>,
	pushPackage(settings: packageSettings): void
}