import * as vscode from 'vscode';
import { enviromentSettings } from "../interfaces";
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { isNullOrWhitespace, stringFormat } from '../constants';
import { BaseCommand } from '../abstractions/baseCommand';
import { PackageSettings } from '../common/packageSettings';
import { ExtensionManager } from '../managers/extensionManager';
import path from 'path';


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
        this.command = `$username = "{0}";$password = "{1}";clio reg-web-app ${server.id} -u ${server.url} -l $username -p $password -i ${server.isNetCore}`;
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
  
    constructor(extensionManager: ExtensionManager, pkg: PackageSettings) {
        super(extensionManager.terminalWrapper);
        const outputPathPackageFile = path.join(extensionManager.packageDirPath, pkg.packageFileName + '.gz');
        this.command = `clio generate-pkg-zip ${pkg.targetFolderPath} -d ${outputPathPackageFile}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class ClioPushPackageCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, targetFilePath: string, enviromentId: string) {
        super(terminal);
        this.command = `clio push-pkg ${targetFilePath} -e ${enviromentId}`;
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