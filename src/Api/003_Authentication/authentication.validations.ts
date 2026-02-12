import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const LoginBody = Validations.JoiObjectKeys({
    sEmail: Validations.CorrectEmail("Users sEmail"),
    sPassword: Validations.CorrectPassword("Users sPassword"),
});

export const RecoveryBody = Validations.JoiObjectKeys({
    sEmail: Validations.RequiredCorrectEmail("Login sEmail"),
});

export const SetPasswordBody = Validations.JoiObjectKeys({
    sNewPassword: Validations.CorrectPassword("Login sPassword"),
    sConfirmNewPassword: Validations.CorrectPassword("Login sPassword"),
    sToken: Validations.RequiredString("Login sToken")
});


export const VerifyUserParams = Validations.JoiObjectKeys({
    sToken: Validations.RequiredString("Login sToken")
});




export const Filters = Validations.Filters;

