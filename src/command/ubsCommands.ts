import * as vscode from 'vscode';
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { enviromentSettings } from '../interfaces';
import { isNullOrWhitespace, stringFormat } from '../constants';
import { BaseCommand } from '../abstractions/baseCommand';
import { PackageSettings } from '../common/packageSettings';
import { ExtensionManager } from '../managers/extensionManager';
import path from 'path';

export class UbsOpenSettingsCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper) {
        super(terminal);
        this.command = 'ubs settings';
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsWebAppRegisterCommand extends BaseCommand {
    private readonly isWindows = process.platform === 'win32';

    private loginQuery?: string;
    private passwordQuery?: string;

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        if(this.isWindows){
            this.command = `$username = "{0}";$password = "{1}";ubs env-set ${server.id} -u ${server.url} -l $username -p $password -i ${server.isNetCore}`;
        }else{
            this.command = `username="{0}"; password="{1}"; ubs env-set ${server.id} -u ${server.url} -l "$username" -p "$password" -i ${server.isNetCore}`;
        }
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

export class UbsWebAppUnRegisterCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs env-remove ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsWebAppPingCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs ping -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsWebAppRestartCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs restart -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsClearRedisDbCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs clear-redis -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsCompileConfigurationCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs compile -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsCreatePackageCommand extends BaseCommand {
  
    constructor(extensionManager: ExtensionManager, pkg: PackageSettings) {
        super(extensionManager.terminalWrapper);
        const outputPathPackageFile = path.join(extensionManager.packageDirPath, pkg.packageFileName + '.gz');
        this.command = `ubs zip ${pkg.targetFolderPath} -d ${outputPathPackageFile}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsPushPackageCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, targetFilePath: string, enviromentId: string) {
        super(terminal);
        this.command = `ubs push ${targetFilePath} -e ${enviromentId}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsCheckInstalledCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper){
        super(terminal);
        this.isSilentExecution = true;
        this.command = `ubs version`;
        this.options = { useErrorOutputToSuccessOutput: false };
    }
}