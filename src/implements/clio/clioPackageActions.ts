import { BasePackageActions } from "../../abstractions/basePackageActions";
import { ClioCreatePackageCommand, ClioPushPackageCommand } from "../../command/clioCommands";
import { PackageSettings } from "../../common/packageSettings";

export class ClioPackageActions extends BasePackageActions {

    public override async createPackage(pkg: PackageSettings): Promise<boolean> {
        const command = new ClioCreatePackageCommand(this.terminal, pkg);
        return await command.execute();
    }

    public override async pushPackage(pkg: PackageSettings, enviromentId: string) {
        const command = new ClioPushPackageCommand(this.terminal, pkg, enviromentId);
        return await command.execute();
    }
}