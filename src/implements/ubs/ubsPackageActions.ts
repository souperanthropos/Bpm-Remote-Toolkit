import { BasePackageActions } from "../../abstractions/basePackageActions";
import { packageSettings } from "../../interfaces";
import { UbsCreatePackageCommand, UbsPushPackageCommand } from '../../command/ubsCommands';

export class UbsPackageActions extends BasePackageActions {

    public override async createPackage(pkg: packageSettings): Promise<boolean> {
        const command = new UbsCreatePackageCommand(this.terminal, pkg);
        return await command.execute();
    }

    public override async pushPackage(pkg: packageSettings) {
        const command = new UbsPushPackageCommand(this.terminal, pkg);
        return await command.execute();
    }
}