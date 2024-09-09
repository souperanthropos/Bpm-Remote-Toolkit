import * as vscode from 'vscode';
import { Logger } from './constants';

export class GitHelper {
    
    private getGitRepo() : any {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    
        if (!gitExtension.enabled) {
            Logger.writeToChannel("Git extension not active");
            return undefined;
        }
        
        const api = gitExtension.getAPI(1);
        const repo = api.repositories[0];
        if(repo === undefined){
            Logger.writeToChannel("Git extension not active");
        }
        return repo;
    }

    private async checkUncommittedChanges() : Promise<boolean>{
        const repo = this.getGitRepo();

        if(repo === undefined){
            return false;
        }

        //Get all changes for first repository in list
        const changes = await repo.diffWithHEAD();
        //Print out array of changes
        if(changes.length > 0){
            Logger.writeToChannel('Error: Uncommitted changes detected.');
            return false;
        }

        return true;
    }

    public getCurrentBranch() : string {
        const repo = this.getGitRepo();
        if(repo){
            const head = repo.state.HEAD;
            const {commit,name: branch} = head;
            console.log({ branch, commit });
        
            return branch;
        }
        return '';
    }

    public async checkBranch(branchName: string) : Promise<boolean> {
        if(await this.checkUncommittedChanges()){
            const currentBranch = this.getCurrentBranch();

            if(currentBranch === branchName){
                return true;
            }
        }

        Logger.writeToChannel('Please select branch: ' + branchName);
        return false;
    }

    public async isPermittedBranch(allowedBranches: string[]) : Promise<boolean> {
        if(await this.checkUncommittedChanges()){
            const currentBranch = this.getCurrentBranch();

            if(allowedBranches?.includes(currentBranch)){
                return true;
            }else{
                Logger.writeToChannel('Branch: ' + currentBranch + ' not permitted');
                Logger.writeToChannel('Please select branch: ' + allowedBranches);
            }
        }

        return false;
    }
}