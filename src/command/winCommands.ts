import path from 'path';
import { packageSettings } from "../interfaces";
import { Command } from "./iCommand";
import { TerminalWrapper } from "../terminal/terminalwrapper";
import { FolderType, getDirectoryName } from "../constants";
import { ExtensionSettings } from '../common/extensionSettings';

export class WinDeleteFileCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, pkg: packageSettings) {
        this.terminal = terminal;
        const packageFileName = `${getDirectoryName(pkg.targetFolderPath)}.gz`;
        const outPathPackageFile = path.join(ExtensionSettings.outputPath(FolderType.package), packageFileName);
        this.command = `del ${outPathPackageFile}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}