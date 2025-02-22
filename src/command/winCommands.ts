import { Command } from "./iCommand";
import { TerminalWrapper } from "../terminal/terminalwrapper";

export class AddToLogCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        this.terminal = terminal;
        this.command = `$content = ${text}'; $content >> ${logFilePath}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}

export class AddToLogWithTimestampCommand implements Command {
    private command: string;
    private terminal: TerminalWrapper;
  
    constructor(terminal: TerminalWrapper, text: string, logFilePath: string) {
        this.terminal = terminal;
        this.command = `$content =  (Get-Date -Format "dd/MM/yyyy HH:mm:ss.fff").ToString() + ' - ${text}'; $content >> ${logFilePath}`;
    }
  
    public async execute(): Promise<boolean> {
        return await this.terminal.executeCommand(this.command);
    }
}