import { BaseCommand } from "../abstractions/baseCommand";
import { PowerShellWrapper } from "../terminal/terminalwrapper";

export class PowerShellRunCommand extends BaseCommand {

    constructor(command: string) {
        super(new PowerShellWrapper());
        this.command = command;
        this.options = { useErrorOutputToSuccessOutput: false };
    }
}

export class PowerShellZipCommand extends BaseCommand {

    constructor(targetPath: string, destinationPath: string){
        super(new PowerShellWrapper());
        this.command = `Compress-Archive -Path ${targetPath} -DestinationPath ${destinationPath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}