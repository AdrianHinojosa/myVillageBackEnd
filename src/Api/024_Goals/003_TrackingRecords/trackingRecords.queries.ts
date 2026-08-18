import { db } from '../../../Config/Db.config';
import { TrackingRecordsModel } from './trackingRecords.model';
import { TrackingRecordTasksModel } from './trackingRecordTasks.model';
import { TrackingRecordFilesModel } from './trackingRecordFiles.model';
import { TrackingRecordHelpsModel } from './trackingRecordHelps.model';
import { GoalsModel } from '../goals.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';
import { normalizeHelpTypesInput, formatHelpTypesForFrontend } from './helpTypes';

class Queries {
    constructor() {};

    /**
     * P8 — replace the help types stored on a record.
     *
     * Delete-then-insert, mirroring how TrackingRecordTasks are handled on update. Runs inside the
     * caller's transaction so a record and its help types are always written atomically.
     * Returns the wire-shaped list for the response.
     */
    static async replaceRecordHelpTypes(sTrackingRecordId: string, aHelpTypes: Array<{sHelpType: string, iHelpAmount: number}>, sUserId: string, trx) {
        await TrackingRecordHelpsModel.query(trx)
            .delete()
            .where('sTrackingRecordId', sTrackingRecordId);

        if (!aHelpTypes || aHelpTypes.length === 0) return [];

        const aInserted = await TrackingRecordHelpsModel.query(trx).insertGraph(
            aHelpTypes.map((oHelp) => ({
                sTrackingRecordId,
                sHelpType: oHelp.sHelpType,
                iHelpAmount: oHelp.iHelpAmount,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId
            }))
        );

        return formatHelpTypesForFrontend(aInserted as any[]);
    }

    /** P8 — read the help types of one record, in wire shape. */
    static async findRecordHelpTypes(sTrackingRecordId: string, trx?) {
        const aRows = await TrackingRecordHelpsModel.query(trx)
            .where('sTrackingRecordId', sTrackingRecordId)
            .orderBy('iHelpAmount', 'desc');
        return formatHelpTypesForFrontend(aRows as any[]);
    }

    // Verify tracking record exists and is active
    static async verifyRecordExists(sTrackingRecordId) {
        return await TrackingRecordsModel.query()
            .findById(sTrackingRecordId)
            .where('bActive', true)
            .whereNull('tDeletedAt');
    }

    // Insert a new tracking record with field mapping from frontend names
    static async insertTrackingRecord(oData: any) {
        return await TrackingRecordsModel.transaction(async (trx) => {
            // Map frontend field names to backend column names
            const recordData: any = {
                sGoalId: oData.sGoalId,
                tRecordDate: oData.dtDate || oData.tRecordDate || null,
                sObservations: oData.sNotes || oData.sObservations || '',
                sCreatedBy: oData.sCreatedBy,
                sLastUpdatedBy: oData.sCreatedBy,
                bActive: true,
                bExcludedFromAverage: false,
            };

            // Map type-specific fields
            if (oData.iCorrect !== undefined && oData.iCorrect !== null) {
                recordData.iHits = oData.iCorrect;
                recordData.iErrors = (oData.iTotal || 0) - oData.iCorrect;
            }
            if (oData.iScaleValue !== undefined && oData.iScaleValue !== null) {
                recordData.iScaleValue = oData.iScaleValue;
            }
            if (oData.iFrequencyCount !== undefined && oData.iFrequencyCount !== null) {
                recordData.iOccurrences = oData.iFrequencyCount;
            }
            if (oData.iDurationMinutes !== undefined && oData.iDurationMinutes !== null) {
                recordData.iDurationMinutes = oData.iDurationMinutes;
            }
            if (oData.iSuccessful !== undefined && oData.iSuccessful !== null) {
                recordData.iAchieved = oData.iSuccessful;
                recordData.iTotal = oData.iOpportunities || 0;
            }

            // Insert the record
            const newRecord = await TrackingRecordsModel.query(trx).insert(recordData).returning('*');

            // Handle TAREAS type: insert task completions
            let aTasksCompleted = [];
            if (oData.aTasksCompleted && oData.aTasksCompleted.length > 0) {
                for (const sGoalTaskId of oData.aTasksCompleted) {
                    await TrackingRecordTasksModel.query(trx).insert({
                        sTrackingRecordId: newRecord.sTrackingRecordId,
                        sGoalTaskId
                    });
                }
                aTasksCompleted = oData.aTasksCompleted;
            }

            // P8: store the help types documented for this session. Purely documental — it is
            // written before recalculateGoalProgress on purpose, to make plain that the
            // recalculation does not read it and the result is identical either way.
            const aNormalizedHelps = normalizeHelpTypesInput(oData);
            const aHelpTypes = await Queries.replaceRecordHelpTypes(
                newRecord.sTrackingRecordId, aNormalizedHelps || [], oData.sCreatedBy, trx
            );

            // Update goal: increment iRecordsCount, set tLastRecord
            await GoalsModel.query(trx).patch({
                iRecordsCount: GoalsModel.raw('"iRecordsCount" + 1'),
                tLastRecord: recordData.tRecordDate || new Date().toISOString()
            }).where('sGoalId', oData.sGoalId);

            // Recalculate progress
            const dUpdatedProgress = await Queries.recalculateGoalProgress(oData.sGoalId, trx);

            // Build response with both frontend and backend field names
            const oResponse = {
                ...newRecord,
                sRecordId: newRecord.sTrackingRecordId,
                dtDate: newRecord.tRecordDate,
                dtCreatedAt: newRecord.created_at,
                sNotes: newRecord.sObservations,
                iCorrect: newRecord.iHits,
                iTotal: (newRecord.iHits !== null && newRecord.iErrors !== null) ? newRecord.iHits + newRecord.iErrors : (newRecord.iTotal || null),
                iFrequencyCount: newRecord.iOccurrences,
                iSuccessful: newRecord.iAchieved,
                iOpportunities: newRecord.iTotal,
                aTasksCompleted,
                aHelpTypes,
                aDocuments: [],
            };

            return { oRecord: oResponse, dUpdatedProgress };
        });
    }

    // Get tracking records for a goal (paginated)
    static async findRecordsByGoal(sGoalId, iPageNumber, iItemsPerPage, tStartDate?, tEndDate?) {
        return await TrackingRecordsModel.query().modify(function (queryBuilder: any) {
            queryBuilder.where('TrackingRecords.sGoalId', sGoalId);
            queryBuilder.where('TrackingRecords.bActive', true);
            queryBuilder.whereNull('TrackingRecords.tDeletedAt');

            if (tStartDate) {
                const sStart = tStartDate instanceof Date ? tStartDate.toISOString().split('T')[0] : String(tStartDate);
                queryBuilder.whereRaw('"TrackingRecords"."tRecordDate"::date >= ?', [sStart]);
            }
            if (tEndDate) {
                const sEnd = tEndDate instanceof Date ? tEndDate.toISOString().split('T')[0] : String(tEndDate);
                queryBuilder.whereRaw('"TrackingRecords"."tRecordDate"::date <= ?', [sEnd]);
            }
        }).orderBy('TrackingRecords.tRecordDate', 'desc').page((iPageNumber - 1), iItemsPerPage);
    }

    // Format records with frontend field names, task completions, documents and help types
    static async formatRecordsForFrontend(records: any[]) {
        const formatted = [];

        // P8: fetch the help types for EVERY record in a single query and group them in memory.
        // The per-record loop below is already N+1 for tasks and files; there is no reason to add
        // another query per record on top of that.
        const aRecordIds = (records || []).map((r: any) => r.sTrackingRecordId);
        const oHelpsByRecord: { [key: string]: any[] } = {};
        if (aRecordIds.length > 0) {
            const aAllHelps = await TrackingRecordHelpsModel.query()
                .whereIn('sTrackingRecordId', aRecordIds)
                .orderBy('iHelpAmount', 'desc');
            for (const oHelp of aAllHelps as any[]) {
                if (!oHelpsByRecord[oHelp.sTrackingRecordId]) oHelpsByRecord[oHelp.sTrackingRecordId] = [];
                oHelpsByRecord[oHelp.sTrackingRecordId].push(oHelp);
            }
        }

        for (const r of records) {
            // Get task completions for this record
            const taskCompletions = await TrackingRecordTasksModel.query()
                .select('sGoalTaskId')
                .where('sTrackingRecordId', r.sTrackingRecordId);
            const aTasksCompleted = taskCompletions.map((t: any) => t.sGoalTaskId);

            // Get attached files for this record
            const recordFiles = await TrackingRecordFilesModel.query()
                .where('sTrackingRecordId', r.sTrackingRecordId)
                .withGraphFetched('File')
                .modifyGraph('File', builder => {
                    builder.where('bActive', true);
                });

            const aDocuments = recordFiles.map((rf: any) => ({
                sFileId: rf.sTrackingRecordFileId,
                sFileName: rf.File?.sFileName || '',
                sFileType: rf.File?.sFileType || '',
                File: {
                    sKey: rf.File?.sFileUrl || rf.File?.sFileKey || ''
                }
            }));

            formatted.push({
                ...r,
                sRecordId: r.sTrackingRecordId,
                dtDate: r.tRecordDate,
                sNotes: r.sObservations,
                iCorrect: r.iHits,
                iTotal: (r.iHits !== null && r.iErrors !== null) ? r.iHits + r.iErrors : (r.iTotal || null),
                iFrequencyCount: r.iOccurrences,
                iSuccessful: r.iAchieved,
                iOpportunities: r.iTotal,
                aTasksCompleted,
                aHelpTypes: formatHelpTypesForFrontend(oHelpsByRecord[r.sTrackingRecordId] || []),
                aDocuments,
            });
        }
        return formatted;
    }

    // Update a tracking record (fields only — does not move goal, touch files, or change exclusion)
    static async updateTrackingRecord(sTrackingRecordId: string, oData: any) {
        return await TrackingRecordsModel.transaction(async (trx) => {
            const existing = await TrackingRecordsModel.query(trx)
                .findById(sTrackingRecordId)
                .where('bActive', true)
                .whereNull('tDeletedAt');
            if (!existing) return null;

            const recordData: any = {
                sLastUpdatedBy: oData.sLastUpdatedBy
            };

            if (oData.dtDate !== undefined) {
                recordData.tRecordDate = oData.dtDate || null;
            }
            if (oData.sNotes !== undefined) {
                recordData.sObservations = oData.sNotes || '';
            }
            if (oData.iCorrect !== undefined && oData.iCorrect !== null) {
                recordData.iHits = oData.iCorrect;
                recordData.iErrors = (oData.iTotal || 0) - oData.iCorrect;
            }
            if (oData.iScaleValue !== undefined && oData.iScaleValue !== null) {
                recordData.iScaleValue = oData.iScaleValue;
            }
            if (oData.iFrequencyCount !== undefined && oData.iFrequencyCount !== null) {
                recordData.iOccurrences = oData.iFrequencyCount;
            }
            if (oData.iDurationMinutes !== undefined && oData.iDurationMinutes !== null) {
                recordData.iDurationMinutes = oData.iDurationMinutes;
            }
            if (oData.iSuccessful !== undefined && oData.iSuccessful !== null) {
                recordData.iAchieved = oData.iSuccessful;
                recordData.iTotal = oData.iOpportunities || 0;
            }

            const updated = await TrackingRecordsModel.query(trx)
                .patchAndFetchById(sTrackingRecordId, recordData)
                .where('bActive', true);

            // Replace TAREAS completions if provided
            let aTasksCompleted: string[] = [];
            if (oData.aTasksCompleted !== undefined && oData.aTasksCompleted !== null) {
                await TrackingRecordTasksModel.query(trx)
                    .delete()
                    .where('sTrackingRecordId', sTrackingRecordId);
                for (const sGoalTaskId of oData.aTasksCompleted) {
                    await TrackingRecordTasksModel.query(trx).insert({
                        sTrackingRecordId,
                        sGoalTaskId
                    });
                }
                aTasksCompleted = oData.aTasksCompleted;
            } else {
                const existingTasks = await TrackingRecordTasksModel.query(trx)
                    .select('sGoalTaskId')
                    .where('sTrackingRecordId', sTrackingRecordId);
                aTasksCompleted = existingTasks.map((t: any) => t.sGoalTaskId);
            }

            // P8: sending aHelpTypes REPLACES the stored set; omitting it leaves it untouched.
            const aNormalizedHelps = normalizeHelpTypesInput(oData);
            let aHelpTypes: Array<{sHelpType: string, iHelpAmount: number}>;
            if (aNormalizedHelps !== null) {
                aHelpTypes = await Queries.replaceRecordHelpTypes(
                    sTrackingRecordId, aNormalizedHelps, oData.sLastUpdatedBy, trx
                );
            } else {
                aHelpTypes = await Queries.findRecordHelpTypes(sTrackingRecordId, trx);
            }

            const dUpdatedProgress = await Queries.recalculateGoalProgress(existing.sGoalId, trx);

            // Preserve attached files in the response (not touched here)
            const recordFiles = await TrackingRecordFilesModel.query(trx)
                .where('sTrackingRecordId', sTrackingRecordId)
                .withGraphFetched('File')
                .modifyGraph('File', builder => {
                    builder.where('bActive', true);
                });
            const aDocuments = recordFiles.map((rf: any) => ({
                sFileId: rf.sTrackingRecordFileId,
                sFileName: rf.File?.sFileName || '',
                sFileType: rf.File?.sFileType || '',
                File: {
                    sKey: rf.File?.sFileUrl || rf.File?.sFileKey || ''
                }
            }));

            const oResponse = {
                ...updated,
                sRecordId: updated.sTrackingRecordId,
                dtDate: updated.tRecordDate,
                dtCreatedAt: updated.created_at,
                sNotes: updated.sObservations,
                iCorrect: updated.iHits,
                iTotal: (updated.iHits !== null && updated.iErrors !== null) ? updated.iHits + updated.iErrors : (updated.iTotal || null),
                iFrequencyCount: updated.iOccurrences,
                iSuccessful: updated.iAchieved,
                iOpportunities: updated.iTotal,
                aTasksCompleted,
                aHelpTypes,
                aDocuments,
            };

            return { oRecord: oResponse, dUpdatedProgress };
        });
    }

    // Toggle exclusion from average
    static async toggleExclusion(sTrackingRecordId, bExcludedFromAverage) {
        return await TrackingRecordsModel.transaction(async (trx) => {
            const updated = await TrackingRecordsModel.query(trx).patchAndFetchById(sTrackingRecordId, {
                bExcludedFromAverage
            }).where('bActive', true);

            // Recalculate progress
            const dUpdatedProgress = await Queries.recalculateGoalProgress(updated.sGoalId, trx);

            return { dUpdatedProgress };
        });
    }

    // Soft delete a tracking record
    static async deleteRecord(sTrackingRecordId) {
        return await TrackingRecordsModel.transaction(async (trx) => {
            const record = await TrackingRecordsModel.query(trx).patchAndFetchById(sTrackingRecordId, {
                bActive: false,
                tDeletedAt: new Date().toISOString()
            }).where('bActive', true);

            // Update goal: decrement iRecordsCount
            await GoalsModel.query(trx).patch({
                iRecordsCount: GoalsModel.raw('GREATEST("iRecordsCount" - 1, 0)')
            }).where('sGoalId', record.sGoalId);

            // Recalculate progress
            const dUpdatedProgress = await Queries.recalculateGoalProgress(record.sGoalId, trx);

            return { sGoalId: record.sGoalId, dUpdatedProgress };
        });
    }

    /**
     * P7 — a divided goal's progress MIRRORS its current stage. It does not average anything.
     *
     * RULE (client, Lucy, 2026-08-18 — supersedes the averaging rule of 2026-08-14):
     *
     *   > "La submeta activa y la meta siempre son el mismo porcentaje. Lo que no quiero es que se
     *   >  promedien la submeta 1 y la submeta 2 para que en la meta me dé un 50%, porque no es real."
     *
     * So: Etapa 1 at 80% and active → the goal reads 80%. Close it, Etapa 2 becomes active with no
     * records → **the goal reads 0%**, on purpose (confirmed with the client): the goal always shows
     * where the student is *right now*, not a blended history.
     *
     * Which stage is "the current one" is not guessed here — the sequential machine in
     * subGoals.queries.ts guarantees at most ONE subgoal is ACTIVE. This function only reads it:
     *
     *   1. the ACTIVE subgoal, if there is one;
     *   2. otherwise the LAST CLOSED one by order — the end state of a finished goal, and also what
     *      shows if the only stage is paused;
     *   3. otherwise 0 (no subgoals, or none started and none closed).
     *
     * `iRecordsCount` and `tLastRecord` stay the SUM and the MAX across every stage: they answer
     * "how much has been logged on this goal", which is what the report and the card print, and that
     * total is not a percentage so it cannot distort the figure above.
     */
    static async recalculateParentRollup(sParentGoalId: string, trx?) {
        if (!sParentGoalId) return null;

        const aSubGoals = await GoalsModel.query(trx)
            .select('sGoalId', 'sStatus', 'dProgress', 'dAverageValue', 'iRecordsCount', 'tLastRecord')
            .where('sParentGoalId', sParentGoalId)
            .where('bActive', true)
            .orderBy('iOrder', 'asc')
            .orderBy('created_at', 'asc');

        // No subgoals left: the parent behaves like an ordinary goal again.
        if (aSubGoals.length === 0) {
            await GoalsModel.query(trx)
                .patch({ dProgress: 0, dAverageValue: 0, iRecordsCount: 0, tLastRecord: null })
                .where('sGoalId', sParentGoalId);
            return 0;
        }

        // Totals span every stage, whatever its state.
        let iRecordsTotal = 0;
        let tLatest: string | null = null;
        for (const oSub of aSubGoals as any[]) {
            iRecordsTotal += Number(oSub.iRecordsCount) || 0;
            if (oSub.tLastRecord && (!tLatest || new Date(oSub.tLastRecord) > new Date(tLatest))) {
                tLatest = oSub.tLastRecord;
            }
        }

        // The percentage comes from ONE stage — never from a blend.
        const aClosed = (aSubGoals as any[]).filter(o => o.sStatus === 'COMPLETED' || o.sStatus === 'NOT_ACHIEVED');
        const oSource = (aSubGoals as any[]).find(o => o.sStatus === 'ACTIVE')
            || (aClosed.length ? aClosed[aClosed.length - 1] : null);

        const dProgress = oSource ? Math.min(Number(oSource.dProgress) || 0, 100) : 0;
        const dAverageValue = oSource ? (Number(oSource.dAverageValue) || 0) : 0;

        await GoalsModel.query(trx).patch({
            dProgress,
            dAverageValue,
            iRecordsCount: iRecordsTotal,
            tLastRecord: tLatest
        }).where('sGoalId', sParentGoalId);

        return dProgress;
    }

    /**
     * PROGRESS RECALCULATION
     *
     * Averages **every** non-excluded record of the goal.
     *
     * ⚠️ CHANGED 2026-08-18 (client, Lucy): *"se promedia toda la submeta"*. This used to average
     * only the **last 3** records — a rule documented in the frontend's `docs/REGLAS_DE_NEGOCIO.md`
     * §7.4 and §13.2 since the original system. The client replaced it, and the decision applies to
     * goals AND subgoals alike (PO, 2026-08-18): one rule everywhere, so a stage and an ordinary goal
     * holding the same records can never show different numbers.
     *
     * What that changes in practice: a bad start is no longer forgotten. A goal that went 10% → 90%
     * used to read 90% (the recent three) and now reads the average of its whole history, so it
     * climbs more slowly. Records the teacher marks as excluded remain the escape hatch for outliers.
     *
     * Applies to a subgoal exactly as it applies to a goal — a subgoal IS a `Goals` row — and every
     * measurement branch below is untouched, so only the size of the window changed.
     */
    static async recalculateGoalProgress(sGoalId, trx?) {
        const queryContext = trx || TrackingRecordsModel;

        // Get the goal to know its measurement type and targets
        const goal = await GoalsModel.query(trx).findById(sGoalId).where('bActive', true);
        if (!goal) return 0;

        // Every non-excluded record. Still ordered newest-first so the set is deterministic.
        const records = await TrackingRecordsModel.query(trx)
            .where('sGoalId', sGoalId)
            .where('bActive', true)
            .whereNull('tDeletedAt')
            .where('bExcludedFromAverage', false)
            .orderBy('tRecordDate', 'desc');

        if (records.length === 0) {
            await GoalsModel.query(trx).patch({ dProgress: 0, dAverageValue: 0 }).where('sGoalId', sGoalId);
            if (goal.sParentGoalId) {
                await Queries.recalculateParentRollup(goal.sParentGoalId, trx);
            }
            return 0;
        }

        let percentages: number[] = [];

        for (const record of records) {
            let pct = 0;
            switch (goal.sMeasurementType) {
                case 'EXACTITUD': {
                    const hits = record.iHits || 0;
                    const errors = record.iErrors || 0;
                    const total = hits + errors;
                    if (total > 0) {
                        const exDirection = goal.sDirection || 'INCREASE';
                        if (exDirection === 'DECREASE') {
                            const baseline = goal.iBaselineValue || 100;
                            const target = goal.iTargetValue || 0;
                            const actualPct = (hits / total) * 100;
                            if (baseline !== target) {
                                pct = ((baseline - actualPct) / (baseline - target)) * 100;
                            }
                        } else {
                            pct = (hits / total) * 100;
                        }
                    }
                    break;
                }
                case 'TAREAS': {
                    // Get completed tasks for this record
                    const taskCompletions = await TrackingRecordTasksModel.query(trx)
                        .where('sTrackingRecordId', record.sTrackingRecordId);
                    const completedCount = taskCompletions.length;
                    // Use iTargetValue as denominator if available, otherwise fallback to total tasks count
                    let denominator = goal.iTargetValue;
                    if (!denominator) {
                        denominator = await GoalTasksModel.query(trx)
                            .where('sGoalId', sGoalId)
                            .resultSize();
                    }
                    if (denominator > 0) {
                        pct = (completedCount / denominator) * 100;
                    }
                    break;
                }
                case 'ESCALA': {
                    const scaleMax = goal.iScaleMax || 5;
                    if (scaleMax > 0 && record.iScaleValue !== null) {
                        pct = (record.iScaleValue / scaleMax) * 100;
                    }
                    break;
                }
                case 'FRECUENCIA': {
                    // Determine direction: null/undefined defaults to DECREASE for backwards compat
                    const freqDirection = goal.sDirection || 'DECREASE';
                    if (freqDirection === 'DECREASE') {
                        const baseline = goal.iBaselineValue || 10;
                        const target = goal.iTargetValue || 0;
                        if (baseline !== target && record.iOccurrences !== null) {
                            pct = ((baseline - record.iOccurrences) / (baseline - target)) * 100;
                        }
                    } else {
                        // INCREASE: higher count is better
                        const target = goal.iTargetValue || 1;
                        if (target > 0 && record.iOccurrences !== null) {
                            pct = (record.iOccurrences / target) * 100;
                        }
                    }
                    break;
                }
                case 'DURACION': {
                    const durDirection = goal.sDirection || 'INCREASE';
                    if (durDirection === 'DECREASE') {
                        const baseline = goal.iBaselineValue || 60;
                        const target = goal.iTargetDuration || 0;
                        if (baseline !== target && record.iDurationMinutes !== null) {
                            pct = ((baseline - record.iDurationMinutes) / (baseline - target)) * 100;
                        }
                    } else {
                        const targetDuration = goal.iTargetDuration || 1;
                        if (targetDuration > 0 && record.iDurationMinutes !== null) {
                            pct = (record.iDurationMinutes / targetDuration) * 100;
                        }
                    }
                    break;
                }
                case 'OPORTUNIDAD': {
                    const achieved = record.iAchieved || 0;
                    const total = record.iTotal || 0;
                    if (total > 0) {
                        const oppDirection = goal.sDirection || 'INCREASE';
                        if (oppDirection === 'DECREASE') {
                            const baseline = goal.iBaselineValue || 100;
                            const target = goal.iTargetValue || 0;
                            const actualPct = (achieved / total) * 100;
                            if (baseline !== target) {
                                pct = ((baseline - actualPct) / (baseline - target)) * 100;
                            }
                        } else {
                            pct = (achieved / total) * 100;
                        }
                    }
                    break;
                }
            }
            percentages.push(pct);
        }

        // Average the percentages and cap at 100
        const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length;
        const dProgress = Math.min(Math.round(avgPct * 100) / 100, 100);

        // Update goal
        await GoalsModel.query(trx).patch({
            dProgress,
            dAverageValue: Math.round(avgPct * 100) / 100
        }).where('sGoalId', sGoalId);

        // P7 — if this is a subgoal, the parent's rolled-up figures just went stale.
        if (goal.sParentGoalId) {
            await Queries.recalculateParentRollup(goal.sParentGoalId, trx);
        }

        return dProgress;
    }
}

export default Queries;
