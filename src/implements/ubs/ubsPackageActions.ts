import { BasePackageActions } from "../../abstractions/basePackageActions";
import { UbsCreatePackageCommand, UbsPushPackageCommand } from '../../command/ubsCommands';

export class UbsPackageActions extends BasePackageActions {

    protected override async createGZFile(): Promise<boolean> {
        const command = new UbsCreatePackageCommand(this.extensionManager, this.packageSettings!);
        return await command.execute();
    }

    protected override async internalPushPackage(enviromentId: string) {
        const command = new UbsPushPackageCommand(this.extensionManager.terminalWrapper, this.destinationFilePath!, enviromentId);
        return await command.execute();
    }
}