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