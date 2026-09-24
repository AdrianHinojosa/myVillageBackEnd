import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

/**
 * Punto 18 — modalidad permitida en el registro PÚBLICO. Solo You / You+: los colegios (SCHOOL) se
 * dan de alta manualmente (cobro por transferencia, Fase 2), nunca por autoservicio.
 */
export const PublicAccountType = Joi.string().valid('YOU', 'YOU_PLUS').required()
    .error(new Error("Public sAccountType"));

/**
 * POST /public/signup — alta pública de una cuenta You/You+.
 * Recibe modalidad + datos del usuario principal (nombre/apellido/celular/correo). El nombre de la
 * cuenta se deriva del nombre de la persona en el controlador (no se pide por separado).
 */
export const SignupBody = Validations.JoiObjectKeys({
    sAccountType: PublicAccountType,
    sAdminName: Validations.RequiredString("SchoolUsers sName"),
    sLastName: Validations.RequiredString("SchoolUsers sLastName"),
    sSecondLastName: Validations.String("SchoolUsers sSecondLastName"),
    sPhone: Validations.RequiredCorrectPhoneNumber("Schools sPhone"),
    sEmail: Validations.RequiredCorrectEmail("SchoolUsers sEmail"),
});
