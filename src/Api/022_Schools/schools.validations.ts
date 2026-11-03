import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

// P5 + Punto 18 — modalidad de cuenta. Opcional en el wire; default SCHOOL.
//   SCHOOL     → colegio (todas las funciones)
//   YOU        → terapeuta/paciente, usuario único, sin docs, sin IEP  (= el antiguo THERAPIST)
//   YOU_PLUS   → centro/terapeutas/pacientes, multiusuario + docs, solo IEP restringido
// THERAPIST se conserva por tolerancia: se trata como YOU en todo el código hasta migrar los datos.
export const AccountType = Joi.string().valid('SCHOOL', 'THERAPIST', 'YOU', 'YOU_PLUS')
    .allow(null).allow('').error(new Error("Schools sAccountType"));

/**
 * P3 — tariff configuration, set by the superadmin. All optional: a school with no tariff simply
 * stays out of billing (sBillingStatus 'NONE'), which is how every pre-existing school behaves.
 *
 * Every monetary field must `.allow(null)`, and that is not cosmetic: the amounts are mutually
 * exclusive by mode, so the form always sends the ones that do not apply as `null` — `VARIABLE` posts
 * `dFixedAmount: null`, `FIXED` posts `dAmountPerTeacher: null, dAmountPerStudent: null`. Without it,
 * `Joi.number()` rejects the null and the whole save fails with 409 *"ingresa un monto mensual
 * válido"*, which made the tariff impossible to set from the UI in EITHER mode. "Optional" has to
 * mean "may be explicitly empty", not merely "may be absent from the payload".
 *
 * `dDiscountPct` had it from the start; the three amounts did not. Inconsistency of my own making.
 */
export const BillingFields = {
    // PLANS = planes A/B/C de Schools por Stripe (ver SCHOOL_PLANS en Stripe.service).
    sBillingMode: Joi.string().valid('FIXED', 'VARIABLE', 'PLANS').allow(null).allow('')
        .error(new Error("Schools sBillingMode")),
    dFixedAmount: Validations.PositiveMonetaryValue("Schools dFixedAmount").allow(null),
    dAmountPerTeacher: Validations.PositiveMonetaryValue("Schools dAmountPerTeacher").allow(null),
    dAmountPerStudent: Validations.PositiveMonetaryValue("Schools dAmountPerStudent").allow(null),
    // 0-100; the service clamps as well, but reject nonsense at the edge.
    dDiscountPct: Joi.number().min(0).max(100).allow(null)
        .error(new Error("Schools dDiscountPct")),

    // ---- Pago por transferencia (billing manual) ----
    // 'STRIPE' -> cobro automático con tarjeta ; 'TRANSFER' -> cobro manual por transferencia.
    // Todo opcional/anulable: partial edits no deben borrar la config. Los existentes quedan
    // en 'TRANSFER' por default de la columna.
    sPaymentMethod: Joi.string().valid('STRIPE', 'TRANSFER').allow(null).allow('')
        .error(new Error("Schools sPaymentMethod")),
    dMonthlyAmount: Validations.PositiveMonetaryValue("Schools dMonthlyAmount").allow(null),
    // Fecha SOLO 'YYYY-MM-DD' como string. NO Joi.date(): éste coerciona a Date UTC-medianoche
    // y pg lo serializa en hora local (México UTC-6) → se guarda un día antes. Como string se
    // almacena tal cual en la columna `date`, sin corrimiento de zona.
    tNextPaymentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null).allow('')
        .error(new Error("Schools tNextPaymentDate")),

    // Override manual del superadmin: "Omitir bloqueo por cobranza". Salta el gate "a fuerza con
    // tarjeta". No toca el cobro ni la suspensión por cobro fallido. Opcional en edits parciales.
    bSkipBillingBlock: Joi.boolean().allow(null)
        .error(new Error("Schools bSkipBillingBlock")),
};

export const CreateSchoolBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Schools sName"),
    sPhone: Validations.String("Schools sPhone"),
    iUsersLimit: Validations.RequiredPositiveInteger("Schools iUsersLimit"),
    iStudentsLimit: Validations.RequiredPositiveInteger("Schools iStudentsLimit"),
    sAccountType: AccountType,
    ...BillingFields,

    // USER info
    sAdminName: Validations.RequiredString("SchoolUsers sName"),
    sLastName: Validations.RequiredString("SchoolUsers sLastName"),
    sSecondLastName: Validations.String("SchoolUsers sSecondLastName"),
    sEmail: Validations.RequiredCorrectEmail("SchoolUsers sEmail"),
});

export const GetSchoolsQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    bBlocked: Validations.Boolean("Schools bBlocked"),
    // Punto 18 — filtro opcional por modalidad en el listado de colegios (superadmin).
    sAccountType: Joi.string().valid('SCHOOL', 'THERAPIST', 'YOU', 'YOU_PLUS').allow(null).allow('')
        .error(new Error("Schools sAccountType")),
});

export const GetSchoolParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

export const UpdateSchoolParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

// Los límites de usuarios/pacientes son obligatorios SOLO para colegios (SCHOOL): su cobro VARIABLE
// se calcula sobre esos límites. En You/You+ (y el legacy THERAPIST) el cobro es por cuota sobre los
// REALES (base + excedente), así que el límite NO afecta el precio y no debe exigirse — si se pidiera,
// bloquearía poner un descuento a una cuenta You sin tener que inventar un límite (feedback Lucy 19/10).
const UsersLimitByModality = Joi.when('sAccountType', {
    is: Joi.valid('YOU', 'YOU_PLUS', 'THERAPIST'),
    then: Joi.number().integer().min(0).allow(null).optional(),
    otherwise: Joi.number().integer().min(0).max(1000000).required(),
}).error(new Error("Schools iUsersLimit"));

const StudentsLimitByModality = Joi.when('sAccountType', {
    is: Joi.valid('YOU', 'YOU_PLUS', 'THERAPIST'),
    then: Joi.number().integer().min(0).allow(null).optional(),
    otherwise: Joi.number().integer().min(0).max(1000000).required(),
}).error(new Error("Schools iStudentsLimit"));

export const UpdateSchoolBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Schools sName"),
    sPhone: Validations.String("Schools sPhone"),
    iUsersLimit: UsersLimitByModality,
    iStudentsLimit: StudentsLimitByModality,
    sAccountType: AccountType,
    ...BillingFields,
});

export const DeleteSchoolParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

export const PatchSchoolBlockedParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

export const PatchSchoolBlockedBody = Validations.JoiObjectKeys({
    bBlocked: Validations.RequiredBoolean("Schools bBlocked"),
});

export const PostSchoolImage = Validations.JoiObjectKeys({
    oImage: Joi.array().items().optional().allow(null).allow("").error(new Error("Schools oImage")),
    bDeleteImage: Validations.RequiredBoolean('Schools bDeleteImage'),
});

export const GetAnalyticsQuery = Validations.JoiObjectKeys({
    tStartDate: Validations.Date("Analytics tStartDate"),
    tEndDate: Validations.Date("Analytics tEndDate"),
});

export const Filters = Validations.Filters;
