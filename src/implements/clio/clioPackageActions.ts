import { BasePackageActions } from "../../abstractions/basePackageActions";
import { ClioCreatePackageCommand, ClioPushPackageCommand } from "../../command/clioCommands";
import { packageSettings } from "../../interfaces";

export class ClioPackageActions extends BasePackageActions {

    public override async createPackage(pkg: packageSettings): Promise<boolean> {
        const command = new ClioCreatePackageCommand(this.terminal, pkg);
        return await command.execute();
    }

    public override async pushPackage(pkg: packageSettings) {
        const command = new ClioPushPackageCommand(this.terminal, pkg);
        return await command.execute();
    }
}