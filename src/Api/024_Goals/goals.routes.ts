import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import GoalController from './goals.controllers';
import * as GoalValidations from './goals.validations';
import { verifySchoolUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';
import GoalTaskRoutes from './001_GoalTasks/goalTasks.routes';
import GoalFileRoutes from './002_GoalFiles/goalFiles.routes';

const router = Router();

// GoalTask sub-routes
router.use('/:sGoalId/goalTasks', aH(GoalTaskRoutes));

// GoalFile sub-routes
router.use('/:sGoalId/goalFiles', aH(GoalFileRoutes));

// Create Goal
router.post('/',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ body: GoalValidations.CreateGoalBody }),
    aH(GoalController.createGoal));

// Get Goals by Student
router.get('/student/:sStudentId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'READ'}])),
    celebrate({ params: GoalValidations.GetGoalsByStudentParams, query: GoalValidations.GetGoalsByStudentQuery }),
    aH(GoalController.getGoalsByStudent));

// Get ONE Goal
router.get('/:sGoalId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'READ'}])),
    celebrate({ params: GoalValidations.GetGoalParams }),
    aH(GoalController.getOneGoal));

// Update Goal
router.put('/:sGoalId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalValidations.UpdateGoalParams, body: GoalValidations.UpdateGoalBody }),
    aH(GoalController.updateGoal));

// Complete Goal
router.patch('/:sGoalId/complete',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalValidations.CompleteGoalParams, body: GoalValidations.CompleteGoalBody }),
    aH(GoalController.completeGoal));

// Delete Goal
router.delete('/:sGoalId',
    aH(verifySchoolUserPermissions([{sModuleName: 'General', sActionCode: 'WRITE'}])),
    celebrate({ params: GoalValidations.DeleteGoalParams }),
    aH(GoalController.deleteGoal));

export default router;
