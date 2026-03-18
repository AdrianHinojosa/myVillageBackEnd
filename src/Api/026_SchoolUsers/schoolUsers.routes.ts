import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import SchoolUserController from './schoolUsers.controllers';
import * as SchoolUserValidations from './schoolUsers.validations';
import { verifySchoolUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// GET /schoolUsers — List school users
router.get('/',
    celebrate({ query: SchoolUserValidations.GetSchoolUsersQuery }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(SchoolUserController.getAllSchoolUsers)
);

// POST /schoolUsers — Create school user
router.post('/',
    celebrate({ body: SchoolUserValidations.CreateSchoolUserBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(SchoolUserController.createSchoolUser)
);

// GET /schoolUsers/:sSchoolUserId — Get one school user
router.get('/:sSchoolUserId',
    celebrate({ params: SchoolUserValidations.GetSchoolUserParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(SchoolUserController.getOneSchoolUser)
);

// PUT /schoolUsers/:sSchoolUserId — Update school user
router.put('/:sSchoolUserId',
    celebrate({ params: SchoolUserValidations.UpdateSchoolUserParams, body: SchoolUserValidations.UpdateSchoolUserBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(SchoolUserController.updateSchoolUser)
);

// POST /schoolUsers/:sSchoolUserId/resetPassword — Reset password
router.post('/:sSchoolUserId/resetPassword',
    celebrate({ params: SchoolUserValidations.ResetPasswordParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(SchoolUserController.resetPassword)
);

export default router;
