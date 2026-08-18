import { GoalsModel } from '../goals.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';
import { TrackingRecordsModel } from '../003_TrackingRecords/trackingRecords.model';
import TrackingRecordQueries from '../003_TrackingRecords/trackingRecords.queries';

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

    /** Closed = finished, one way or the other. A closed stage never drives the goal again. */
    static readonly CLOSED_STATUSES: string[] = ['COMPLETED', 'NOT_ACHIEVED'];

    // ------------------------------------------------------------------------------------------
    // SEQUENTIAL MACHINE (client decision 2026-08-18)
    //
    // The signed scope document always described subgoals as sequential — *"solo una activa a la
    // vez, hay que cerrar una para avanzar"* — and the client confirmed it. Independent statuses
    // (what the frontend originally built, approved as Q3 on 2026-08-02) are therefore reverted.
    //
    // INVARIANT enforced by every method below: **at most ONE subgoal of a goal is ACTIVE.**
    // The others are PAUSED (queued, waiting their turn) or closed.
    //
    // The invariant is what makes the goal's percentage meaningful: the goal mirrors "the current
    // stage", and that phrase only has one answer if only one stage can be current.
    // ------------------------------------------------------------------------------------------

    /** The stage currently in progress, or null. There can only be one. */
    static async findActiveSubGoal(sGoalId, trx?) {
        return await GoalsModel.query(trx)
            .where('sParentGoalId', sGoalId)
            .where('bActive', true)
            .where('sStatus', 'ACTIVE')
            .orderBy('iOrder', 'asc')
            .orderBy('created_at', 'asc')
            .first();
    }

    /**
     * Hand the baton to the next stage: the first non-closed one in order, skipping `sSkipId`
     * (the stage that just closed, whose row may not be visible to this transaction yet).
     * Returns the stage that was activated, or null when the goal has no unfinished stage left.
     */
    static async activateNextSubGoal(sGoalId, sSkipId, sUserId, trx) {
        const oNext = await GoalsModel.query(trx)
            .where('sParentGoalId', sGoalId)
            .where('bActive', true)
            .whereNotIn('sStatus', Queries.CLOSED_STATUSES)
            .whereNot('sGoalId', sSkipId)
            .orderBy('iOrder', 'asc')
            .orderBy('created_at', 'asc')
            .first();

        if (!oNext) return null;
        if (oNext.sStatus === 'ACTIVE') return oNext;

        return await GoalsModel.query(trx)
            .patchAndFetchById(oNext.sGoalId, { sStatus: 'ACTIVE', sLastUpdatedBy: sUserId });
    }

    /** Step aside: every other stage of this goal that is ACTIVE goes back to PAUSED. */
    static async pauseOtherActiveSubGoals(sGoalId, sKeepId, sUserId, trx) {
        return await GoalsModel.query(trx)
            .patch({ sStatus: 'PAUSED', sLastUpdatedBy: sUserId })
            .where('sParentGoalId', sGoalId)
            .where('bActive', true)
            .where('sStatus', 'ACTIVE')
            .whereNot('sGoalId', sKeepId);
    }

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
     * Create a subgoal. Measurement type is inherited from the parent — never taken from the
     * request — and the parent is flagged as divided in the same transaction so the flag cannot
     * drift from reality.
     *
     * The new stage's status is decided by the sequential machine, NOT by the request: it becomes
     * ACTIVE only when the goal has no stage in progress, otherwise it queues as PAUSED.
     */
    static async insertSubGoal(sGoalId, oParent, oBody, aTasks, sUserId) {
        return await GoalsModel.transaction(async (trx) => {
            const iNextOrder = await GoalsModel.query(trx)
                .where('sParentGoalId', sGoalId)
                .where('bActive', true)
                .resultSize();

            // Sequential: the first stage starts in progress, the rest wait in line. `sStatus` from
            // the body is deliberately ignored — GoalForm always sends ACTIVE, and honouring that
            // would put two stages in progress and make "the goal's percentage" ambiguous.
            const oCurrent = await Queries.findActiveSubGoal(sGoalId, trx);
            const sStatus = oCurrent ? 'PAUSED' : 'ACTIVE';

            const newSubGoal = await GoalsModel.query(trx).insert({
                sStudentId: oParent.sStudentId,
                sParentGoalId: sGoalId,
                /**
                 * P7 — the subgoal may carry its OWN title (PO decision 2026-08-14), but only when
                 * one is actually supplied. `GoalForm.vue` hides the title input in subgoal mode and
                 * still sends `sTitle: ''`, so accepting a blank value verbatim would leave every
                 * subgoal with an empty heading. Falling back to the parent keeps the contract's
                 * inheritance rule working until the frontend adds the field.
                 */
                sTitle: (oBody.sTitle && String(oBody.sTitle).trim()) ? String(oBody.sTitle).trim() : oParent.sTitle,
                // Measurement type stays inherited and immutable — the contract fixes it for all
                // subgoals of a goal so every stage measures the same thing.
                sMeasurementType: oParent.sMeasurementType,
                // Own configuration
                sDescription: oBody.sDescription,
                sStatus,
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

            // P7 — the parent mirrors its current stage, so adding the FIRST stage (which becomes
            // the current one, with no records yet) moves the goal to 0%. Adding a queued stage
            // leaves it untouched. Either way the rollup is the single place that decides.
            await TrackingRecordQueries.recalculateParentRollup(sGoalId, trx);

            return { ...newSubGoal, GoalTasks: aInsertedTasks };
        });
    }

    /**
     * Update a subgoal. Only fields actually present in the body are patched, so a partial edit
     * cannot blank out configuration the client did not send. Measurement type is never patched —
     * it belongs to the parent.
     *
     * This is also where the sequential machine advances, because closing a stage is an ordinary
     * `PUT { sStatus: 'COMPLETED' }`:
     *
     *   closed  (COMPLETED / NOT_ACHIEVED) → the next unfinished stage is activated automatically
     *   ACTIVE  (start it, or reopen a closed one) → any other stage in progress is paused
     *   PAUSED  → the goal is left with no stage in progress, which the rollup handles
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
            // Own title, only when a real value is sent. A blank one leaves the current title
            // alone rather than wiping it — see the note in insertSubGoal.
            if (oBody.sTitle !== undefined && String(oBody.sTitle).trim()) {
                oPatch.sTitle = String(oBody.sTitle).trim();
            }

            const updatedSubGoal = await GoalsModel.query(trx)
                .patchAndFetchById(sSubGoalId, oPatch)
                .where('bActive', true);

            // ---- sequential machine ----
            const sParentGoalId = updatedSubGoal?.sParentGoalId;
            if (sParentGoalId && oPatch.sStatus !== undefined) {
                if (Queries.CLOSED_STATUSES.includes(oPatch.sStatus)) {
                    // This stage is finished — promote the next one in line.
                    await Queries.activateNextSubGoal(sParentGoalId, sSubGoalId, sUserId, trx);
                } else if (oPatch.sStatus === 'ACTIVE') {
                    // Starting or reopening a stage: it becomes the only one in progress.
                    await Queries.pauseOtherActiveSubGoals(sParentGoalId, sSubGoalId, sUserId, trx);
                }
            }

            // Any status change moves which stage the goal mirrors, and so its percentage.
            if (sParentGoalId) {
                await TrackingRecordQueries.recalculateParentRollup(sParentGoalId, trx);
            }

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

            if (deletedSubGoal?.sParentGoalId) {
                // Deleting the stage in progress would leave the goal with no current stage — hand
                // the baton on, so the sequence continues instead of stalling at 0%.
                if (deletedSubGoal.sStatus === 'ACTIVE') {
                    await Queries.activateNextSubGoal(deletedSubGoal.sParentGoalId, sSubGoalId, sUserId, trx);
                }
                // Removing a stage changes which one the goal mirrors, and its record total.
                await TrackingRecordQueries.recalculateParentRollup(deletedSubGoal.sParentGoalId, trx);
            }

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
