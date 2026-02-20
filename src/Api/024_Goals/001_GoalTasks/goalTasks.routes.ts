import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import GoalTaskController from './goalTasks.controllers';
import * as GoalTaskValidations from './goalTasks.validations';
import { verifySchoolUserPermissions } from '../../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router({mergeParams: true});

// Create GoalTask
router.post('/',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalTaskValidations.CreateGoalTaskParams, body: GoalTaskValidations.CreateGoalTaskBody }),
    aH(GoalTaskController.createGoalTask));

// Get all GoalTasks by Goal
router.get('/',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'READ'}])),
    celebrate({ params: GoalTaskValidations.GetGoalTasksParams }),
    aH(GoalTaskController.getGoalTasks));

// Update GoalTask
router.put('/:sGoalTaskId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalTaskValidations.UpdateGoalTaskParams, body: GoalTaskValidations.UpdateGoalTaskBody }),
    aH(GoalTaskController.updateGoalTask));

// Toggle GoalTask completed status
router.patch('/:sGoalTaskId/toggle',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalTaskValidations.ToggleGoalTaskParams, body: GoalTaskValidations.ToggleGoalTaskBody }),
    aH(GoalTaskController.toggleGoalTask));

// Delete GoalTask
router.delete('/:sGoalTaskId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalTaskValidations.DeleteGoalTaskParams }),
    aH(GoalTaskController.deleteGoalTask));

export default router;
