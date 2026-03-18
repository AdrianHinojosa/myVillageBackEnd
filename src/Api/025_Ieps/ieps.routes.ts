import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import IepController from './ieps.controllers';
import * as IepValidations from './ieps.validations';
import { verifySchoolUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// POST /iep — Create or Update IEP
router.post('/',
    celebrate({ body: IepValidations.UpsertIepBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(IepController.upsertIep)
);

// GET /iep?sStudentId=xxx — Get Student's IEP
router.get('/',
    celebrate({ query: IepValidations.GetIepQuery }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(IepController.getIep)
);

export default router;
