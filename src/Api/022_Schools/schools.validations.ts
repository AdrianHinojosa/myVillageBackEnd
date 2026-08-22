import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

// P5 — account type. Optional on the wire; defaults to SCHOOL so existing callers are unaffected.
export const AccountType = Joi.string().valid('SCHOOL', 'THERAPIST')
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
    sBillingMode: Joi.string().valid('FIXED', 'VARIABLE').allow(null).allow('')
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
    tNextPaymentDate: Validations.Date("Schools tNextPaymentDate").allow(null),
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
});

export const GetSchoolParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

export const UpdateSchoolParams = Validations.JoiObjectKeys({
    sSchoolId: Validations.RequiredUUID("Schools sSchoolId"),
});

export const UpdateSchoolBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Schools sName"),
    sPhone: Validations.String("Schools sPhone"),
    iUsersLimit: Validations.RequiredPositiveInteger("Schools iUsersLimit"),
    iStudentsLimit: Validations.RequiredPositiveInteger("Schools iStudentsLimit"),
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
