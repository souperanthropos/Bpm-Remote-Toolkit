import { ExecuteOptions, TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BaseCommand{
    private terminal: TerminalWrapper;
    
    protected command!: string;
    protected options!: ExecuteOptions;

    constructor(terminal: TerminalWrapper){
        this.terminal = terminal;
    }

    public async execute(): Promise<boolean>{
        return await this.terminal.executeCommand(this.command, this.options);
    }
}