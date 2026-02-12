import * as Validations from '../../../Middlewares/Validations.mw';

class Rules {

    public GetModuleParams: object;

    constructor() {

        this.GetModuleParams = Validations.JoiObjectKeys({
            ...Validations.Filters,
            sAdministratorModuleId: Validations.UUID("Modules sAdministratorModuleId"),
        });

    }
}

export default new Rules();