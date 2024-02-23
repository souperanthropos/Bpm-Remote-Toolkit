import * as vscode from 'vscode';
import { TerminalWrapper } from '../terminal/terminalwrapper';
import { serverSettings } from '../interfaces';

export class ClioManager {
    private terminal: TerminalWrapper;

    public onCommandExecuteError?: (message: string, showbutton: boolean) => void;
    public onCommandExecuteComplete?: (message: string, showbutton: boolean) => void;

    constructor(private terminalLog: vscode.OutputChannel) {
        this.terminal = new TerminalWrapper();
    }

    public OpenSettings(){
        this.terminal.callInInteractiveTerminal('clio open-settings');
    }

    public async WebAppRestart(server: serverSettings){
        if (!server.isEnable) {
			vscode.window.showInformationMessage(
				`You cannot execute this command because server ${server.id} is disabled.`
			);
		} else {
			const result = await this.terminal.callInInteractiveTerminal(`clio restart-web-app ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Restart web app failed.', true);
            }
		}
    }

    public async ClearRedisDb(server: serverSettings) {
        if (!server.isEnable) {
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			);
		} else {
            const result = await this.terminal.callInInteractiveTerminal(`clio clear-redis-db ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Clear redis db failed.', true);
            }
		}
    }

    public async CompileConfiguration(server: serverSettings) {
        if (!server.isEnable) {
			vscode.window.showInformationMessage(
				"You cannot execute this command because server " + server.id + " is disabled."
			);
		} else {
            const result = await this.terminal.callInInteractiveTerminal(`clio compile-configuration ${server.id}`);
            if (!result && this.onCommandExecuteError) {
                this.onCommandExecuteError('Compile configuration failed.', true);
            }
		}
    }
}