import { BasePackageActions } from "../../abstractions/basePackageActions";
import { packageSettings } from "../../interfaces";
import { WinDeleteFileCommand } from '../../command/winCommands';
import { UbsCreatePackageCommand, UbsPushPackageCommand } from '../../command/ubsCommands';

export class UbsPackageActions extends BasePackageActions {

    public override async createPackage(pkg: packageSettings): Promise<boolean> {
        const delCommand = new WinDeleteFileCommand(this.terminal, pkg);
        await delCommand.execute();
        const command = new UbsCreatePackageCommand(this.terminal, pkg);
        return await command.execute();
    }

    public override async pushPackage(pkg: packageSettings) {
        const command = new UbsPushPackageCommand(this.terminal, pkg);
        return await command.execute();
    }
}