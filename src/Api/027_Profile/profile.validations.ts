import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const UpdateProfileBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Profile sName"),
    sPhone: Validations.String("Profile sPhone"),
});

export const ChangePasswordBody = Validations.JoiObjectKeys({
    sCurrentPassword: Validations.RequiredString("Profile sCurrentPassword"),
    sNewPassword: Joi.string().trim().required().min(8)
        .regex(/[A-Z]/, 'uppercase')
        .regex(/[a-z]/, 'lowercase')
        .regex(/[0-9]/, 'number')
        .regex(/[!@#$%^&*]/, 'special')
        .error(new Error("Profile sNewPassword")),
    sConfirmPassword: Validations.RequiredString("Profile sConfirmPassword"),
});
