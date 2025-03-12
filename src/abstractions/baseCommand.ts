import { ExecuteOptions, TerminalWrapper } from "../terminal/terminalwrapper";

export abstract class BaseCommand{
    private terminal: TerminalWrapper;
    
    protected command!: string;
    protected options!: ExecuteOptions;
    protected isSilentExecution: boolean = false;

    constructor(terminal: TerminalWrapper){
        this.terminal = terminal;
    }

    public async execute(): Promise<boolean>{
        if(this.isSilentExecution){
            try{
                await this.terminal.executeSilent(this.command);
                return true;
            }catch{
                return false;
            }
        }
        return await this.terminal.executeCommand(this.command, this.options);
    }
}