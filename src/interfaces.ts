export interface appSettings {
	targetFolderPath: string;
	targetRemoteUrl: string | undefined;
	remoteLogin: string | undefined;
	remotePassword: string | undefined;
	gitBranchName: string | undefined;
}

export interface serverSettings {
	id: string;
    url: string | undefined;
    gitBranchName: string | undefined;
    isEnable: boolean;
	isRegister: boolean;
}