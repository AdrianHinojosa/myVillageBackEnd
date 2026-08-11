import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

// P5 — account type. Optional on the wire; defaults to SCHOOL so existing callers are unaffected.
export const AccountType = Joi.string().valid('SCHOOL', 'THERAPIST')
    .allow(null).allow('').error(new Error("Schools sAccountType"));

/**
 * P3 — tariff configuration, set by the superadmin. All optional: a school with no tariff simply
 * stays out of billing (sBillingStatus 'NONE'), which is how every pre-existing school behaves.
 */
export const BillingFields = {
    sBillingMode: Joi.string().valid('FIXED', 'VARIABLE').allow(null).allow('')
        .error(new Error("Schools sBillingMode")),
    dFixedAmount: Validations.PositiveMonetaryValue("Schools dFixedAmount"),
    dAmountPerTeacher: Validations.PositiveMonetaryValue("Schools dAmountPerTeacher"),
    dAmountPerStudent: Validations.PositiveMonetaryValue("Schools dAmountPerStudent"),
    // 0-100; the service clamps as well, but reject nonsense at the edge.
    dDiscountPct: Joi.number().min(0).max(100).allow(null)
        .error(new Error("Schools dDiscountPct")),
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
