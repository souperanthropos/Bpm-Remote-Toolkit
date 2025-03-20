import { BasePackageActions } from "../../abstractions/basePackageActions";
import { UbsCreatePackageCommand, UbsPushPackageCommand } from '../../command/ubsCommands';
import { PackageSettings } from "../../common/packageSettings";

export class UbsPackageActions extends BasePackageActions {

    public override async createPackage(pkg: PackageSettings): Promise<boolean> {
        const command = new UbsCreatePackageCommand(this.terminal, pkg);
        return await command.execute();
    }

    public override async pushPackage(pkg: PackageSettings, enviromentId: string) {
        const command = new UbsPushPackageCommand(this.terminal, pkg, enviromentId);
        return await command.execute();
    }
}