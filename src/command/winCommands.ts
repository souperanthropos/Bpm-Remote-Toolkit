import { Command } from "./iCommand";
import { ExecuteOptions, TerminalWrapper } from "../terminal/terminalwrapper";

export class AddToLogCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        this.terminal = terminal;
        this.command = `$content = ${text}'; $content >> ${logFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}

export class AddToLogWithTimestampCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
    private options: ExecuteOptions;
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        this.terminal = terminal;
        this.command = `$content =  (Get-Date -Format "dd/MM/yyyy HH:mm:ss.fff").ToString() + ' - ${text}'; $content >> ${logFilePath}`;
        this.options = { useErrorOutputToSuccessOutput: true };
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command, this.options);
    }
}