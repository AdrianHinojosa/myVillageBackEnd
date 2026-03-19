import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import ProfileController from './profile.controllers';
import * as ProfileValidations from './profile.validations';
import { verifySchoolUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// GET /profile — Get own profile
router.get('/',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(ProfileController.getProfile)
);

// PUT /profile — Update own profile
router.put('/',
    celebrate({ body: ProfileValidations.UpdateProfileBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(ProfileController.updateProfile)
);

// PUT /profile/password — Change own password
router.put('/password',
    celebrate({ body: ProfileValidations.ChangePasswordBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(ProfileController.changePassword)
);

export default router;
