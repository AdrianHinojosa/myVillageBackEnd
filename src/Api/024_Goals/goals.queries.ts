import { GoalsModel, IGoals } from './goals.model';
import { GoalTasksModel } from './001_GoalTasks/goalTasks.model';
import { StudentsModel } from '../023_Students/students.model';

class Queries {
    constructor() {
    };

    // Verify goal exists and is active
    static async verifyGoalExists(sGoalId) {
        return await GoalsModel.query().findById(sGoalId).where('bActive', true);
    }

    // Verify goal exists and belongs to a specific student
    static async verifyGoalExistsByStudent(sStudentId, sGoalId) {
        return await GoalsModel.query()
            .findById(sGoalId)
            .where('sStudentId', sStudentId)
            .where('bActive', true);
    }

    // Insert a new goal with optional tasks
    static async insertGoal({sStudentId, sTitle, sDescription, sMeasurementType, tStartDate, tTargetDate, iTargetValue, iTargetDuration, iScaleMin, iScaleMax, sFrequencyUnit, sCreatedBy}, aTasks) {
        return await GoalsModel.transaction(async (trx) => {
            // Insert goal
            const newGoal = await GoalsModel.query(trx).insert({
                sStudentId,
                sTitle,
                sDescription,
                sMeasurementType,
                sStatus: 'ACTIVE',
                tStartDate,
                tTargetDate,
                iTargetValue,
                iTargetDuration,
                iScaleMin,
                iScaleMax,
                sFrequencyUnit,
                sCreatedBy,
                sLastUpdatedBy: sCreatedBy,
                bActive: true
            }).returning('*');

            // Insert tasks if provided
            let goalTasks = [];
            if (aTasks && aTasks.length > 0) {
                for (const task of aTasks) {
                    const newTask = await GoalTasksModel.query(trx).insert({
                        sGoalId: newGoal.sGoalId,
                        sTitle: task.sTitle,
                        bCompleted: false,
                        iOrder: task.iOrder || 0
                    }).returning('*');
                    goalTasks.push(newTask);
                }
            }

            return { ...newGoal, GoalTasks: goalTasks };
        });
    }

    // Update a goal with optional task replacement
    static async updateGoal(sGoalId, {sTitle, sDescription, tStartDate, tTargetDate, iTargetValue, iTargetDuration, iScaleMin, iScaleMax, sFrequencyUnit, sLastUpdatedBy}, aTasks) {
        return await GoalsModel.transaction(async (trx) => {
            // Update goal
            const updatedGoal = await GoalsModel.query(trx).patchAndFetchById(sGoalId, {
                sTitle,
                sDescription,
                tStartDate,
                tTargetDate,
                iTargetValue,
                iTargetDuration,
                iScaleMin,
                iScaleMax,
                sFrequencyUnit,
                sLastUpdatedBy
            }).where('bActive', true);

            // If tasks are provided, replace them
            let goalTasks = [];
            if (aTasks !== undefined && aTasks !== null) {
                // Delete existing tasks for this goal
                await GoalTasksModel.query(trx).delete().where('sGoalId', sGoalId);

                // Insert new tasks
                if (aTasks.length > 0) {
                    for (const task of aTasks) {
                        const newTask = await GoalTasksModel.query(trx).insert({
                            sGoalId: sGoalId,
                            sTitle: task.sTitle,
                            bCompleted: task.bCompleted || false,
                            iOrder: task.iOrder || 0
                        }).returning('*');
                        goalTasks.push(newTask);
                    }
                }
            } else {
                // Fetch existing tasks if not replacing
                goalTasks = await GoalTasksModel.query(trx)
                    .where('sGoalId', sGoalId)
                    .orderBy('iOrder', 'asc');
            }

            return { ...updatedGoal, GoalTasks: goalTasks };
        });
    }

    // Find paginated goals by student with search and status filter
    static async findGoalsByStudent(sStudentId, iPageNumber, iItemsPerPage, sSearch, sStatus) {
        return await GoalsModel.query().modify(function (queryBuilder: any) {
            queryBuilder.where('Goals.bActive', true)
            queryBuilder.where('Goals.sStudentId', sStudentId)

            queryBuilder.withGraphFetched('GoalTasks')
            queryBuilder.modifyGraph('GoalTasks', builder => {
                builder.orderBy('iOrder', 'asc');
            })

            if (sSearch) {
                queryBuilder.where(function () {
                    this.whereRaw(`unaccent("Goals"."sTitle") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }

            if (sStatus) {
                queryBuilder.where('Goals.sStatus', sStatus)
            }
        }).orderBy('Goals.updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
    }

    // Find one goal with tasks
    static async findOneGoal(sGoalId) {
        return await GoalsModel.query()
            .findById(sGoalId)
            .where('bActive', true)
            .withGraphFetched('GoalTasks')
            .modifyGraph('GoalTasks', builder => {
                builder.orderBy('iOrder', 'asc');
            });
    }

    // Complete a goal (set status, completed date, and optional notes)
    static async completeGoal(sGoalId, sStatus, sLastUpdatedBy, sCompletionNotes?) {
        return await GoalsModel.query().patchAndFetchById(sGoalId, {
            sStatus,
            tCompletedDate: new Date().toISOString(),
            sCompletionNotes: sCompletionNotes || null,
            sLastUpdatedBy
        }).where('bActive', true);
    }

    // Soft delete a goal
    static async deleteGoal(sGoalId, sLastDeletedBy) {
        return await GoalsModel.query().patchAndFetchById(sGoalId, {
            bActive: false,
            sLastDeletedBy
        }).where('bActive', true);
    }
}

export default Queries;
