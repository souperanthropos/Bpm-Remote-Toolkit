import { PackageSettings } from "./common/packageSettings";

export interface enviromentSettings {
	id: string;
    url: string | undefined;
	isNetCore: boolean;
    gitBranchName: string | undefined;
    isEnable: boolean;
	isRegister: boolean;
}

export interface queueItem {
	package: PackageSettings;
	isRunning: boolean;
	Completed: { isSuccess: boolean } | null
}