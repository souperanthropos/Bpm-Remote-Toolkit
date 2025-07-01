import { BasePackageActions } from "../../abstractions/basePackageActions";
import { ClioCreatePackageCommand, ClioPushPackageCommand } from "../../command/clioCommands";

export class ClioPackageActions extends BasePackageActions {

    protected override async createGZFile(): Promise<boolean> {
        const command = new ClioCreatePackageCommand(this.extensionManager, this.packageSettings!);
        return await command.execute();
    }

    protected override async internalPushPackage(enviromentId: string) {
        const command = new ClioPushPackageCommand(this.extensionManager.terminalWrapper, this.pushingFilePath, enviromentId);
        return await command.execute();
    }
}