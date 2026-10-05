import * as Validations from '../../../Middlewares/Validations.mw';

class Rules {

    public GetModuleParams: object;

    constructor() {

        this.GetModuleParams = Validations.JoiObjectKeys({
            ...Validations.Filters,
            // Label must match the catalogue group name in ValidationError.util.ts, which is
            // `AdministratorModules`. It said "Modules", so the lookup resolved to nothing.
            sAdministratorModuleId: Validations.UUID("AdministratorModules sAdministratorModuleId"),
        });

    }
}

export default new Rules();