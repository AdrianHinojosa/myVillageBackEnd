import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateSchoolUserBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("SchoolUsersCrud sName"),
    sLastName: Validations.RequiredString("SchoolUsersCrud sLastName"),
    sSecondLastName: Validations.String("SchoolUsersCrud sSecondLastName"),
    sEmail: Validations.RequiredCorrectEmail("SchoolUsersCrud sEmail"),
    sType: Joi.string().valid('FACULTY', 'ADMINISTRATION').required().error(new Error("SchoolUsersCrud sType")),
});

export const GetSchoolUsersQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    sType: Joi.string().valid('FACULTY', 'ADMINISTRATION').allow(null).allow('').error(new Error("SchoolUsersCrud sType")),
    bActive: Validations.Boolean("SchoolUsersCrud bActive"),
});

export const GetSchoolUserParams = Validations.JoiObjectKeys({
    sSchoolUserId: Validations.RequiredUUID("SchoolUsersCrud sSchoolUserId"),
});

export const UpdateSchoolUserParams = Validations.JoiObjectKeys({
    sSchoolUserId: Validations.RequiredUUID("SchoolUsersCrud sSchoolUserId"),
});

export const UpdateSchoolUserBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("SchoolUsersCrud sName"),
    sLastName: Validations.RequiredString("SchoolUsersCrud sLastName"),
    sSecondLastName: Validations.String("SchoolUsersCrud sSecondLastName"),
    sType: Joi.string().valid('FACULTY', 'ADMINISTRATION').required().error(new Error("SchoolUsersCrud sType")),
    bActive: Validations.Boolean("SchoolUsersCrud bActive"),
});

export const ResetPasswordParams = Validations.JoiObjectKeys({
    sSchoolUserId: Validations.RequiredUUID("SchoolUsersCrud sSchoolUserId"),
});
