import { TerminalWrapper } from "../terminal/terminalwrapper";
import { BaseCommand } from "../abstractions/baseCommand";

export class AddToLogCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        super(terminal);
        this.command = `$content = ${text}'; $content >> ${logFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}

export class AddToLogWithTimestampCommand extends BaseCommand {
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        super(terminal);
        this.command = `$content =  (Get-Date -Format "dd/MM/yyyy HH:mm:ss.fff").ToString() + ' - ${text}'; $content >> ${logFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
}