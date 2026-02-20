import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../../Middlewares/Error.mw';

// Queries
import GoalTaskQueries from './goalTasks.queries';
import GoalQueries from '../goals.queries';

// Messages
import SuccessMessages from '../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Create a single goal task
    async createGoalTask(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sGoalId} = req.params;
        const {sTitle, bCompleted, iOrder} = req.body;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        const newGoalTask = await GoalTaskQueries.insertGoalTask({
            sGoalId,
            sTitle,
            bCompleted: bCompleted ?? false,
            iOrder
        });

        return res.status(201).json({
            message: SuccessMessages.GoalTasks.createGoalTask[sLang],
            goalTask: newGoalTask,
            success: true
        });
    }

    // Get all tasks for a goal
    async getGoalTasks(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sGoalId} = req.params;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        const goalTasks = await GoalTaskQueries.findGoalTasksByGoal(sGoalId);

        return res.status(201).json({
            message: SuccessMessages.GoalTasks.getAllGoalTasks[sLang],
            goalTasks: goalTasks,
            success: true
        });
    }

    // Update a goal task
    async updateGoalTask(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sGoalId, sGoalTaskId} = req.params;
        const {sTitle, bCompleted, iOrder} = req.body;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify task exists
        const myGoalTask = await GoalTaskQueries.verifyGoalTaskExists(sGoalTaskId);
        if (!myGoalTask) {
            return next(new MyError(404, ErrorMessages.GoalTasks.notFound[sLang]));
        }

        // Update task
        const updatedGoalTask = await GoalTaskQueries.updateGoalTask(sGoalTaskId, {
            sTitle,
            bCompleted,
            iOrder
        });

        return res.status(201).json({
            message: SuccessMessages.GoalTasks.updateGoalTask[sLang],
            goalTask: updatedGoalTask,
            success: true
        });
    }

    // Toggle completed status of a goal task
    async toggleGoalTask(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sGoalId, sGoalTaskId} = req.params;
        const {bCompleted} = req.body;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify task exists
        const myGoalTask = await GoalTaskQueries.verifyGoalTaskExists(sGoalTaskId);
        if (!myGoalTask) {
            return next(new MyError(404, ErrorMessages.GoalTasks.notFound[sLang]));
        }

        // Toggle completed
        const toggledGoalTask = await GoalTaskQueries.toggleGoalTaskCompleted(sGoalTaskId, bCompleted);

        return res.status(201).json({
            message: SuccessMessages.GoalTasks.toggleGoalTask[sLang],
            goalTask: toggledGoalTask,
            success: true
        });
    }

    // Delete a goal task (hard delete)
    async deleteGoalTask(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sGoalId, sGoalTaskId} = req.params;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify task exists
        const myGoalTask = await GoalTaskQueries.verifyGoalTaskExists(sGoalTaskId);
        if (!myGoalTask) {
            return next(new MyError(404, ErrorMessages.GoalTasks.notFound[sLang]));
        }

        // Hard delete task
        await GoalTaskQueries.deleteGoalTask(sGoalTaskId);

        return res.status(201).json({
            message: SuccessMessages.GoalTasks.deleteGoalTask[sLang],
            success: true
        });
    }
}

export default new Controllers();
