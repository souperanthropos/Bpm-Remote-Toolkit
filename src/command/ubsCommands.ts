import * as vscode from 'vscode';
import path from 'path';
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { Command } from "./iCommand";
import { enviromentSettings, packageSettings } from '../interfaces';
import { FolderType, getDirectoryName } from '../constants';
import { ExtensionSettings } from '../common/extensionSettings';

export class UbsOpenSettingsCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper) {
        this.terminal = terminal;
        this.command = 'ubs settings';
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class UbsWebAppRegisterCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper) {
        this.terminal = terminal;
        this.command = '';
    }
  
    public async execute(): Promise<boolean> {
        let yesPressed = false;
        await vscode.window
            .showInformationMessage('This command is not supported in the current version of the utility. You will need to manually add the server.', "Yes", "No")
            .then(async answer => {
                if (answer === "Yes") {
                    var settingsCommand = new UbsOpenSettingsCommand(this.terminal);
                    await settingsCommand.execute();
                    yesPressed = true;
                }
            });
        return yesPressed;
    }
}

export class UbsWebAppUnRegisterCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper) {
        this.terminal = terminal;
        this.command = ``;
    }
  
    public async execute(): Promise<boolean> {
        return true;
    }
}

export class UbsWebAppPingCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper) {
        this.terminal = terminal;
        this.command = ``;
    }
  
    public async execute(): Promise<boolean> {
        return true;
    }
}

export class UbsWebAppRestartCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `ubs restart -e ${server.id}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class UbsClearRedisDbCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `ubs clear-redis -e ${server.id}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class UbsCompileConfigurationCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, server: enviromentSettings) {
        this.terminal = terminal;
        this.command = `ubs compile -e ${server.id}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class UbsCreatePackageCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        this.terminal = terminal;
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `ubs zip ${pkg.targetFolderPath} -d ${outPathPackageFile}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class UbsPushPackageCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        this.terminal = terminal;
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `ubs push ${outPathPackageFile} -e ${pkg.targetEnviroment?.id}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}