import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateSchoolBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Schools sName"),
    sPhone: Validations.String("Schools sPhone"),
    iUsersLimit: Validations.RequiredPositiveInteger("Schools iUsersLimit"),
    iStudentsLimit: Validations.RequiredPositiveInteger("Schools iStudentsLimit"),

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

export const Filters = Validations.Filters;
