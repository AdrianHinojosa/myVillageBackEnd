
import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';


export const CreateAdministratorBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Administrators sName"),
    sLastName: Validations.RequiredString("Administrators sLastName"),
    sSecondLastName: Validations.String("Administrators sSecondLastName"),
    sEmail: Validations.RequiredString("Administrators sEmail"),
    sPhoneNumber: Validations.RequiredString("Administrators sPhoneNumber"),
    sPhoneExtension: Validations.String("Administrators sPhoneExtension"),
    // Array of permissions. Require both object properties per array element when array length > 1.
    aAdministratorPermissionsSet: Joi.array().items(
        Joi.object({
          sAdministratorModuleId: Validations.RequiredUUID("AdministratorModules sAdministratorModuleId"),
          sActionCode: Validations.StringActionType("AdministratorModules sAction"),
        })
      ).required().error(new Error("AdministratorModules sAdministratorModuleId")),
});

export const GetAdministratorsQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    bPlatformAccess: Validations.Boolean("Users bPlatformAccess")
});

export const GetAdministratorParams = Validations.JoiObjectKeys({
    sAdministratorId: Validations.RequiredUUID("Administrators sAdministratorId"),
});

export const UpdateAdministratorParams = Validations.JoiObjectKeys({
    sAdministratorId: Validations.RequiredUUID("Administrators sAdministratorId"),
});


export const UpdateAdministratorBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Administrators sName"),
    sLastName: Validations.RequiredString("Administrators sLastName"),
    sSecondLastName: Validations.String("Administrators sSecondLastName"),
    sPhoneNumber: Validations.RequiredString("Administrators sPhoneNumber"),
    sPhoneExtension: Validations.String("Administrators sPhoneExtension"),
    // Array of permissions. Require both object properties per array element when array length > 1.
    aAdministratorPermissionsSet: Joi.array().items(
        Joi.object({
          sAdministratorModuleId: Validations.RequiredUUID("AdministratorModules sAdministratorModuleId"),
          sActionCode: Validations.StringActionType("AdministratorModules sAction"),
        })
      ).required().error(new Error("AdministratorModules sAdministratorModuleId")),
});

export const PatchAdministratorAccessBody = Validations.JoiObjectKeys({
    bPlatformAccess: Validations.RequiredBoolean("Administrators bPlatformAccess")
});

export const DeleteAdministratorParams = Validations.JoiObjectKeys({
    sAdministratorId: Validations.RequiredUUID("Administrators sAdministratorId"),
});

export const Filters = Validations.Filters;