import { Router } from "express";
import aH from "express-async-handler";
import { celebrate} from "celebrate";
import GoalFileController from './goalFiles.controllers';
import * as GoalFileValidations from './goalFiles.validations';
import { verifySchoolUserPermissions } from '../../../Middlewares/001_Permissions.mw.ts/schools.permissions';

// Images Upload
import upload from 'express-fileupload';
const router = Router({mergeParams: true});

// Done
router.post('/',
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    aH(upload()),
    celebrate({ params: GoalFileValidations.useGoalFileParams, body: GoalFileValidations.CreateGoalFileBody}),
    aH(GoalFileController.createGoalFile));

// GET ALL GoalFiles
router.get('/',
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
    celebrate({params: GoalFileValidations.useGoalFileParams, query: GoalFileValidations.GetGoalFilesQuery }),
    aH(GoalFileController.getGoalFiles));

// GET ONE GoalFile
router.get('/:sGoalFileId',
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
    celebrate({ params: GoalFileValidations.GetGoalFileParams }),
    aH(GoalFileController.getOneGoalFile));

// DELETE GoalFile
router.delete('/:sGoalFileId',
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    celebrate({ params: GoalFileValidations.DeleteGoalFileParams }),
    aH(GoalFileController.deleteGoalFile));


export default router;
