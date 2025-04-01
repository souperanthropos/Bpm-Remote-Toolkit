import { BaseCommand } from "../abstractions/baseCommand";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export class PowerShellZipCommand extends BaseCommand {

    constructor(terminalWrapper: TerminalWrapper, sourceFilePath: string, destinationFilePath: string){
        super(terminalWrapper);
        this.command = `Compress-Archive -Path ${sourceFilePath} -DestinationPath ${destinationFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}