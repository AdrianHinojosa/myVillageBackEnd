import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import SubGoalController from './subGoals.controllers';
import * as SubGoalValidations from './subGoals.validations';
import { verifySchoolUserPermissions } from '../../../Middlewares/001_Permissions.mw.ts/schools.permissions';

/**
 * Punto 7 — top-level `/subGoals` routes.
 *
 * The nested ones (`/goals/:sGoalId/subGoals`) are declared in goals.routes.ts, the same way
 * the nested trackingRecords read route is.
 */
const router = Router({ mergeParams: true });

// PUT /subGoals/:sSubGoalId — edit a subgoal
router.put('/:sSubGoalId',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    celebrate({ params: SubGoalValidations.UpdateSubGoalParams, body: SubGoalValidations.UpdateSubGoalBody }),
    aH(SubGoalController.updateSubGoal));

// DELETE /subGoals/:sSubGoalId — delete a subgoal and its records
router.delete('/:sSubGoalId',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    celebrate({ params: SubGoalValidations.DeleteSubGoalParams }),
    aH(SubGoalController.deleteSubGoal));

// GET /subGoals/:sSubGoalId/trackingRecords — records of a subgoal
router.get('/:sSubGoalId/trackingRecords',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    celebrate({ params: SubGoalValidations.GetSubGoalRecordsParams, query: SubGoalValidations.GetSubGoalRecordsQuery }),
    aH(SubGoalController.getSubGoalRecords));

export default router;
