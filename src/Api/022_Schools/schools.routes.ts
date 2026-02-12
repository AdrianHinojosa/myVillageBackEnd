import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import SchoolController from './schools.controllers';
import * as SchoolValidations from './schools.validations';

import { verifyAdminPermissions } from '../../Middlewares/001_Permissions.mw.ts/Permissions.mw';
import upload from 'express-fileupload';

const router = Router();

// Analytics
router.get('/analytics',
        aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
        aH(SchoolController.getSchoolsAnalytics));

// Create
router.post('/',
            celebrate({ body: SchoolValidations.CreateSchoolBody }),
            aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
            aH(SchoolController.createSchool));

// Get ALL
router.get('/',
            celebrate({ query: SchoolValidations.GetSchoolsQuery }),
            aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
            aH(SchoolController.getAllSchools));

// Get ONE
router.get('/:sSchoolId',
        celebrate({ params: SchoolValidations.GetSchoolParams }),
        aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
        aH(SchoolController.getOneSchool));

// Update
router.put('/:sSchoolId',
           celebrate({ params: SchoolValidations.UpdateSchoolParams, body: SchoolValidations.UpdateSchoolBody }),
           aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
           aH(SchoolController.updateSchool));

// Delete
router.delete('/:sSchoolId',
        celebrate({ params: SchoolValidations.DeleteSchoolParams }),
        aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
        aH(SchoolController.deleteSchool));

// Patch Blocked
router.patch('/:sSchoolId',
        celebrate({  body: SchoolValidations.PatchSchoolBlockedBody, params: SchoolValidations.PatchSchoolBlockedParams }),
        aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
        aH(SchoolController.patchSchoolBlocked));


// POST Insert school logo (Admin route)
router.post('/image',
    aH(upload()),
    celebrate({
        body: SchoolValidations.PostSchoolImage
    }),
   aH(verifyAdminPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    aH(SchoolController.uploadSchoolImage)
);



export default router;
