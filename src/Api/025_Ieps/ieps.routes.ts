import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import IepController from './ieps.controllers';
import * as IepValidations from './ieps.validations';
import { verifySchoolUserPermissions, denyTherapistAccess } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// POST /iep — Create or Update IEP
// P5: therapist accounts cannot use the IEP module.
router.post('/',
    celebrate({ body: IepValidations.UpsertIepBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(denyTherapistAccess() as any),
    aH(IepController.upsertIep)
);

// GET /iep?sStudentId=xxx — Get Student's IEP
// P5: therapist accounts cannot VIEW the IEP module either ("no podrá visualizar o utilizar").
router.get('/',
    celebrate({ query: IepValidations.GetIepQuery }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(denyTherapistAccess() as any),
    aH(IepController.getIep)
);

export default router;
