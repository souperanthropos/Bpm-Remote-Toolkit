import * as vscode from 'vscode';
import path from 'path';
import { Command } from "./iCommand";
import { enviromentSettings, packageSettings } from "../interfaces";
import { ExecuteOptions, TerminalWrapper } from "../terminal/terminalwrapper";
import { FolderType, getDirectoryName, isNullOrWhitespace, stringFormat } from '../constants';
import { ExtensionSettings } from '../common/extensionSettings';


export class ClioOpenSettingsCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper) {
        this.terminal = terminal;
        this.command = 'clio open-settings';
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioWebAppRegisterCommand implements Command {
    private command: string;
    private loginQuery?: string;
    private passwordQuery?: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;

    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
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
                var outputComman = stringFormat(this.command, this.loginQuery!, this.passwordQuery!);
                return await this.terminal.executeCommand(outputComman, this.options);
            }
        }
        return false;
    }
}

export class ClioWebAppUnRegisterCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `clio unreg-web-app ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioWebAppPingCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `clio ping -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioWebAppRestartCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `clio restart-web-app -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioClearRedisDbCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `clio clear-redis-db -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioCompileConfigurationCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `clio compile-configuration -e ${server.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioCreatePackageCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        this.terminal = terminal;
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `clio generate-pkg-zip ${pkg.targetFolderPath} -d ${outPathPackageFile}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioPushPackageCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        this.terminal = terminal;
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `clio push-pkg ${outPathPackageFile} -e ${pkg.targetEnviroment?.id}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class ClioCheckInstalledCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;

    constructor(terminal: TerminalWrapper){
        this.terminal = terminal;
        this.command = `clio version`;
        this.options = { useErrorOutputToSuccessOutput: false };
    }

    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}