import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import GoalQueries from './goals.queries';
import StudentQueries from '../023_Students/students.queries';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Create a new goal
    async createGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId, sTitle, sDescription, sMeasurementType, tStartDate, tTargetDate, iTargetValue, iTargetDuration, iScaleMin, iScaleMax, sFrequencyUnit, aTasks} = req.body;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Insert goal with tasks
        const newGoal = await GoalQueries.insertGoal({
            sStudentId,
            sTitle,
            sDescription,
            sMeasurementType,
            tStartDate,
            tTargetDate,
            iTargetValue,
            iTargetDuration,
            iScaleMin,
            iScaleMax,
            sFrequencyUnit,
            sCreatedBy: sUserId
        }, aTasks);

        return res.status(201).json({
            message: SuccessMessages.Goals.createGoal[sLang],
            goal: newGoal,
            success: true
        });
    }

    // Get all goals by student (paginated)
    async getGoalsByStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.params;
        let {sSearch, iItemsPerPage = 20, iPageNumber = 1, sStatus} = req.query;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        const arrGoals = await GoalQueries.findGoalsByStudent(sStudentId, iPageNumber, iItemsPerPage, sSearch, sStatus);

        const iNumPages = Math.ceil(arrGoals.total / Number(iItemsPerPage));

        return res.status(201).json({
            message: SuccessMessages.Goals.getAllGoals[sLang],
            goals: arrGoals.results,
            iTotal: arrGoals.total,
            iNumPages: iNumPages,
            success: true
        });
    }

    // Get one goal
    async getOneGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sGoalId} = req.params;

        // Get goal
        const myGoal = await GoalQueries.findOneGoal(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify that the goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        return res.status(201).json({
            message: SuccessMessages.Goals.getOneGoal[sLang],
            goal: myGoal,
            success: true
        });
    }

    // Update a goal
    async updateGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sGoalId} = req.params;
        const {sTitle, sDescription, tStartDate, tTargetDate, iTargetValue, iTargetDuration, iScaleMin, iScaleMax, sFrequencyUnit, aTasks} = req.body;

        // Verify goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify that the goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Update goal with tasks
        const updatedGoal = await GoalQueries.updateGoal(sGoalId, {
            sTitle,
            sDescription,
            tStartDate,
            tTargetDate,
            iTargetValue,
            iTargetDuration,
            iScaleMin,
            iScaleMax,
            sFrequencyUnit,
            sLastUpdatedBy: sUserId
        }, aTasks);

        return res.status(201).json({
            message: SuccessMessages.Goals.updateGoal[sLang],
            goal: updatedGoal,
            success: true
        });
    }

    // Complete a goal (set status and tCompletedDate)
    async completeGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sGoalId} = req.params;
        const {sStatus, sCompletionNotes} = req.body;

        // Verify goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify that the goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Complete goal
        const completedGoal = await GoalQueries.completeGoal(sGoalId, sStatus, sUserId, sCompletionNotes);

        return res.status(201).json({
            message: SuccessMessages.Goals.completeGoal[sLang],
            goal: completedGoal,
            success: true
        });
    }

    // Delete a goal (soft delete)
    async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sGoalId} = req.params;

        // Verify goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify that the goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Soft delete goal
        await GoalQueries.deleteGoal(sGoalId, sUserId);

        return res.status(201).json({
            message: SuccessMessages.Goals.deleteGoal[sLang],
            success: true
        });
    }
}

export default new Controllers();
