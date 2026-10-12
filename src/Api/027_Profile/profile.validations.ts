import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const UpdateProfileBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Profile sName"),
    sPhone: Validations.String("Profile sPhone"),
});

export const ChangePasswordBody = Validations.JoiObjectKeys({
    sCurrentPassword: Validations.RequiredString("Profile sCurrentPassword"),
    // Misma política única que set-password (StrongPassword): 8+ con mayúscula, minúscula, número y
    // un carácter especial (cualquiera no alfanumérico). Antes el especial era solo [!@#$%^&*], más
    // restrictivo que el frontend.
    sNewPassword: Validations.StrongPassword("Profile sNewPassword"),
    sConfirmPassword: Validations.RequiredString("Profile sConfirmPassword"),
});
