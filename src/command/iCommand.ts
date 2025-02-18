export interface Command {
    execute(): Promise<boolean>;
}