import { BaseCommand } from "../abstractions/baseCommand";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export class PowerShellRunCommand extends BaseCommand {

    constructor(terminalWrapper: TerminalWrapper, command: string) {
        super(terminalWrapper);
        this.command = command;
        this.options = { useErrorOutputToSuccessOutput: false };
    }
}

export class PowerShellZipCommand extends BaseCommand {

    constructor(terminalWrapper: TerminalWrapper, sourcePath: string, destinationFilePath: string){
        super(terminalWrapper);
        this.command = `Compress-Archive -Path ${sourcePath} -DestinationPath ${destinationFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}