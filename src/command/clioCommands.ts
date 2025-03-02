import * as vscode from 'vscode';
import path from 'path';
import { enviromentSettings, packageSettings } from "../interfaces";
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { FolderType, getDirectoryName, isNullOrWhitespace, stringFormat } from '../constants';
import { ExtensionSettings } from '../common/extensionSettings';
import { BaseCommand } from '../abstractions/baseCommand';


export class ClioOpenSettingsCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper) {
        super(terminal);
        this.command = 'clio open-settings';
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioWebAppRegisterCommand extends BaseCommand {
    private loginQuery?: string;
    private passwordQuery?: string;

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio reg-web-app ${server.id} -u ${server.url} -l {0} -p {1} -i ${server.isNetCore}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }

    public async execute(): Promise<boolean> {
        this.loginQuery = await vscode.window.showInputBox({
            placeHolder: "Login",
            prompt: "Enter login for connecting to Bpmsoft"
        });
        if (!isNullOrWhitespace(this.loginQuery)) {
            this.passwordQuery = await vscode.window.showInputBox({
                placeHolder: "Password",
                prompt: "Enter password for connecting to Bpmsoft",
                password: true
            });
            if (!isNullOrWhitespace(this.passwordQuery)) {
                this.command = stringFormat(this.command, this.loginQuery!, this.passwordQuery!);
                return await super.execute();
            }
        }
        return false;
    }
}

export class ClioWebAppUnRegisterCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio unreg-web-app ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioWebAppPingCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio ping -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioWebAppRestartCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio restart-web-app -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioClearRedisDbCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio clear-redis-db -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioCompileConfigurationCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `clio compile-configuration -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioCreatePackageCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        super(terminal);
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `clio generate-pkg-zip ${pkg.targetFolderPath} -d ${outPathPackageFile}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioPushPackageCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        super(terminal);
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `clio push-pkg ${outPathPackageFile} -e ${pkg.targetEnviroment?.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioCheckInstalledCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper){
        super(terminal);
        this.isSilentExecution = true;
        this.command = `clio version`;
        this.options = { useErrorOutputToSuccessOutput: false };
    }
}