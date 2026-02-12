import { GoalTasksModel, IGoalTasks } from './goalTasks.model';

class Queries {
    constructor() {
    };

    // Find all tasks for a goal ordered by iOrder asc
    static async findGoalTasksByGoal(sGoalId) {
        return await GoalTasksModel.query()
            .where('sGoalId', sGoalId)
            .orderBy('iOrder', 'asc');
    }

    // Insert a single goal task
    static async insertGoalTask({sGoalId, sTitle, bCompleted, iOrder}) {
        return await GoalTasksModel.query().insert({
            sGoalId,
            sTitle,
            bCompleted: bCompleted || false,
            iOrder: iOrder || 0
        }).returning('*');
    }

    // Update a goal task
    static async updateGoalTask(sGoalTaskId, {sTitle, bCompleted, iOrder}) {
        return await GoalTasksModel.query().patchAndFetchById(sGoalTaskId, {
            sTitle,
            bCompleted,
            iOrder
        });
    }

    // Hard delete a single goal task
    static async deleteGoalTask(sGoalTaskId) {
        return await GoalTasksModel.query().deleteById(sGoalTaskId);
    }

    // Delete all tasks for a goal
    static async deleteAllGoalTasksByGoal(sGoalId) {
        return await GoalTasksModel.query().delete().where('sGoalId', sGoalId);
    }

    // Toggle completed status of a goal task
    static async toggleGoalTaskCompleted(sGoalTaskId, bCompleted) {
        return await GoalTasksModel.query().patchAndFetchById(sGoalTaskId, {
            bCompleted
        });
    }

    // Verify goal task exists
    static async verifyGoalTaskExists(sGoalTaskId) {
        return await GoalTasksModel.query().findById(sGoalTaskId);
    }
}

export default Queries;
