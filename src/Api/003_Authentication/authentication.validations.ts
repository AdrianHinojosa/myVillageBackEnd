import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const LoginBody = Validations.JoiObjectKeys({
    sEmail: Validations.CorrectEmail("Users sEmail"),
    // Login NO valida complejidad ni set de caracteres: solo que venga una contraseña. La identidad
    // se resuelve comparando el hash. Antes usaba CorrectPassword, que podía rechazar el login de
    // usuarios cuya contraseña quedara fuera de su charset (p. ej. con `-`).
    sPassword: Validations.RequiredString("Users sPassword"),
});

export const RecoveryBody = Validations.JoiObjectKeys({
    sEmail: Validations.RequiredCorrectEmail("Login sEmail"),
});

export const SetPasswordBody = Validations.JoiObjectKeys({
    sNewPassword: Validations.StrongPassword("Login sPassword"),
    sConfirmNewPassword: Validations.StrongPassword("Login sPassword"),
    sToken: Validations.RequiredString("Login sToken")
});


export const VerifyUserParams = Validations.JoiObjectKeys({
    sToken: Validations.RequiredString("Login sToken")
});




export const Filters = Validations.Filters;

