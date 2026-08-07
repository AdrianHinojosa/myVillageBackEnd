import { GoalsModel } from '../goals.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';
import { TrackingRecordsModel } from '../003_TrackingRecords/trackingRecords.model';

/**
 * Punto 7 — Submetas.
 *
 * A subgoal is a `Goals` row with `sParentGoalId` set, so every calculated field
 * (`dProgress`, `dAverageValue`, `iRecordsCount`, `tLastRecord`) is maintained by the existing
 * `recalculateGoalProgress()` with no extra code — that is the whole point of the design.
 */
class Queries {
    constructor() {};

    // Maximum subgoals per goal. Matches MAX_SUBGOALS in the frontend's app/utils/subGoals.ts.
    static readonly MAX_SUBGOALS: number = 5;

    /** A subgoal, by id. Only rows that actually have a parent qualify. */
    static async verifySubGoalExists(sSubGoalId) {
        return await GoalsModel.query()
            .findById(sSubGoalId)
            .where('bActive', true)
            .whereNotNull('sParentGoalId');
    }

    /** A top-level goal, by id — used to validate the parent. Rejects subgoals (no nesting). */
    static async verifyParentGoalExists(sGoalId) {
        return await GoalsModel.query()
            .findById(sGoalId)
            .where('bActive', true)
            .whereNull('sParentGoalId');
    }

    static async countSubGoals(sGoalId) {
        const oResult: any = await GoalsModel.query()
            .where('sParentGoalId', sGoalId)
            .where('bActive', true)
            .count('sGoalId as count')
            .first();
        return parseInt(oResult?.count ?? '0');
    }

    /** All subgoals of a goal, with their tasks, ordered for display. */
    static async findSubGoalsByGoal(sGoalId) {
        return await GoalsModel.query()
            .where('sParentGoalId', sGoalId)
            .where('bActive', true)
            .withGraphFetched('GoalTasks')
            .modifyGraph('GoalTasks', builder => {
                builder.orderBy('iOrder', 'asc');
            })
            .orderBy('iOrder', 'asc')
            .orderBy('created_at', 'asc');
    }

    /**
     * Create a subgoal. Title and measurement type are inherited from the parent — never taken
     * from the request — and the parent is flagged as divided in the same transaction so the flag
     * cannot drift from reality.
     */
    static async insertSubGoal(sGoalId, oParent, oBody, aTasks, sUserId) {
        return await GoalsModel.transaction(async (trx) => {
            const iNextOrder = await GoalsModel.query(trx)
                .where('sParentGoalId', sGoalId)
                .where('bActive', true)
                .resultSize();

            const newSubGoal = await GoalsModel.query(trx).insert({
                sStudentId: oParent.sStudentId,
                sParentGoalId: sGoalId,
                // Inherited, immutable
                sTitle: oParent.sTitle,
                sMeasurementType: oParent.sMeasurementType,
                // Own configuration
                sDescription: oBody.sDescription,
                sStatus: oBody.sStatus || 'ACTIVE',
                tStartDate: oBody.tStartDate,
                tTargetDate: oBody.tTargetDate,
                iTargetValue: oBody.iTargetValue,
                iTargetDuration: oBody.iTargetDuration,
                iScaleMin: oBody.iScaleMin,
                iScaleMax: oBody.iScaleMax,
                sFrequencyUnit: oBody.sFrequencyUnit,
                iBaselineValue: oBody.iBaselineValue,
                sDirection: oBody.sDirection,
                iTargetOpportunities: oBody.iTargetOpportunities,
                iTargetPercentage: oBody.iTargetPercentage,
                iOrder: iNextOrder,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId,
                bActive: true
            }).returning('*');

            // Keep the parent's flag truthful: a goal with subgoals is divided, whatever the
            // frontend sent at creation time.
            await GoalsModel.query(trx)
                .patch({ bHasSubGoals: true, sLastUpdatedBy: sUserId })
                .where('sGoalId', sGoalId);

            let aInsertedTasks = [];
            if (aTasks && aTasks.length > 0) {
                for (const oTask of aTasks) {
                    const newTask = await GoalTasksModel.query(trx).insert({
                        sGoalId: newSubGoal.sGoalId,
                        sTitle: oTask.sTitle,
                        bCompleted: oTask.bCompleted || false,
                        iOrder: oTask.iOrder || 0
                    }).returning('*');
                    aInsertedTasks.push(newTask);
                }
            }

            return { ...newSubGoal, GoalTasks: aInsertedTasks };
        });
    }

    /**
     * Update a subgoal. Only fields actually present in the body are patched, so a partial edit
     * cannot blank out configuration the client did not send. Title and measurement type are never
     * patched — they belong to the parent.
     */
    static async updateSubGoal(sSubGoalId, oBody, aTasks, sUserId) {
        return await GoalsModel.transaction(async (trx) => {
            const aPatchable = [
                'sDescription', 'sStatus', 'tStartDate', 'tTargetDate', 'tCompletedDate',
                'sCompletionNotes', 'iTargetValue', 'iTargetDuration', 'iScaleMin', 'iScaleMax',
                'sFrequencyUnit', 'iBaselineValue', 'sDirection', 'iTargetOpportunities',
                'iTargetPercentage'
            ];
            const oPatch: any = { sLastUpdatedBy: sUserId };
            for (const sField of aPatchable) {
                if (oBody[sField] !== undefined) oPatch[sField] = oBody[sField];
            }

            const updatedSubGoal = await GoalsModel.query(trx)
                .patchAndFetchById(sSubGoalId, oPatch)
                .where('bActive', true);

            // Tasks are replaced when provided, matching how goals behave.
            let aResultTasks = [];
            if (aTasks !== undefined && aTasks !== null) {
                await GoalTasksModel.query(trx).delete().where('sGoalId', sSubGoalId);
                for (const oTask of aTasks) {
                    const newTask = await GoalTasksModel.query(trx).insert({
                        sGoalId: sSubGoalId,
                        sTitle: oTask.sTitle,
                        bCompleted: oTask.bCompleted || false,
                        iOrder: oTask.iOrder || 0
                    }).returning('*');
                    aResultTasks.push(newTask);
                }
            } else {
                aResultTasks = await GoalTasksModel.query(trx)
                    .where('sGoalId', sSubGoalId)
                    .orderBy('iOrder', 'asc');
            }

            return { ...updatedSubGoal, GoalTasks: aResultTasks };
        });
    }

    /**
     * Soft-delete a subgoal and its tracking records.
     * The scope document is explicit: "DELETE /subGoals/:sSubGoalId — eliminar submeta (y sus
     * registros)". Records are soft-deleted the way trackingRecords does it (bActive + tDeletedAt)
     * so the two delete paths agree.
     */
    static async deleteSubGoal(sSubGoalId, sUserId) {
        return await GoalsModel.transaction(async (trx) => {
            const deletedSubGoal = await GoalsModel.query(trx)
                .patchAndFetchById(sSubGoalId, { bActive: false, sLastDeletedBy: sUserId })
                .where('bActive', true);

            await TrackingRecordsModel.query(trx)
                .patch({ bActive: false, tDeletedAt: new Date().toISOString() })
                .where('sGoalId', sSubGoalId)
                .where('bActive', true);

            return deletedSubGoal;
        });
    }

    /**
     * Shape a subgoal row for the wire.
     *
     * Carries BOTH `sSubGoalId` and `sGoalId` with the same value — the dual-naming convention this
     * codebase already uses (`sRecordId`/`sTrackingRecordId`, `dtDate`/`tRecordDate`). The frontend
     * keys subgoals by `sSubGoalId`, and its own `oActiveStageAsGoal` computed aliases it back to
     * `sGoalId` to reuse the goal components, so both names are genuinely useful.
     */
    static formatSubGoalForFrontend(oRow: any) {
        return {
            ...oRow,
            // The subgoal's own id. This is the row's primary key (`Goals.sGoalId` internally).
            sSubGoalId: oRow.sGoalId,
            // Deliberately REMAPPED to the parent, matching the frontend's `ISubGoal`, where
            // `sSubGoalId` is the subgoal and `sGoalId` is the goal it belongs to.
            sGoalId: oRow.sParentGoalId,
            aGoalTasks: oRow.GoalTasks || []
        };
    }
}

export default Queries;
