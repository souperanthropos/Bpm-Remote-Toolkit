import * as vscode from 'vscode';
import path from 'path';
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { enviromentSettings, packageSettings } from '../interfaces';
import { FolderType, getDirectoryName, isNullOrWhitespace, stringFormat } from '../constants';
import { ExtensionSettings } from '../common/extensionSettings';
import { BaseCommand } from '../abstractions/baseCommand';

export class UbsOpenSettingsCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper) {
        super(terminal);
        this.command = 'ubs settings';
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsWebAppRegisterCommand extends BaseCommand {
    private loginQuery?: string;
    private passwordQuery?: string;

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        super(terminal);
        this.command = `ubs env-set ${server.id} -u ${server.url} -l {0} -p {1} -i ${server.isNetCore}`;
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
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        super(terminal);
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `ubs zip ${pkg.targetFolderPath} -d ${outPathPackageFile}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsPushPackageCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        super(terminal);
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `ubs push ${outPathPackageFile} -e ${pkg.targetEnviroment?.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class UbsCheckInstalledCommand extends BaseCommand {

    constructor(terminal: TerminalWrapper){
        super(terminal);
        this.command = `ubs version`;
        this.options = { useErrorOutputToSuccessOutput: false };
    }
}