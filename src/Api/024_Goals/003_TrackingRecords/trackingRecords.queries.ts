import { db } from '../../../Config/Db.config';
import { TrackingRecordsModel } from './trackingRecords.model';
import { TrackingRecordTasksModel } from './trackingRecordTasks.model';
import { TrackingRecordFilesModel } from './trackingRecordFiles.model';
import { GoalsModel } from '../goals.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';

class Queries {
    constructor() {};

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
                queryBuilder.where('TrackingRecords.tRecordDate', '>=', tStartDate);
            }
            if (tEndDate) {
                queryBuilder.where('TrackingRecords.tRecordDate', '<=', tEndDate);
            }
        }).orderBy('TrackingRecords.tRecordDate', 'desc').page((iPageNumber - 1), iItemsPerPage);
    }

    // Format records with frontend field names, task completions, and documents
    static async formatRecordsForFrontend(records: any[]) {
        const formatted = [];
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
                aDocuments,
            });
        }
        return formatted;
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
     * PROGRESS RECALCULATION
     * Uses the last 3 non-excluded records to calculate goal progress.
     */
    static async recalculateGoalProgress(sGoalId, trx?) {
        const queryContext = trx || TrackingRecordsModel;

        // Get the goal to know its measurement type and targets
        const goal = await GoalsModel.query(trx).findById(sGoalId).where('bActive', true);
        if (!goal) return 0;

        // Get last 3 non-excluded records
        const records = await TrackingRecordsModel.query(trx)
            .where('sGoalId', sGoalId)
            .where('bActive', true)
            .whereNull('tDeletedAt')
            .where('bExcludedFromAverage', false)
            .orderBy('tRecordDate', 'desc')
            .limit(3);

        if (records.length === 0) {
            await GoalsModel.query(trx).patch({ dProgress: 0, dAverageValue: 0 }).where('sGoalId', sGoalId);
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
                        const baseline = goal.iBaselineValue || 0;
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

        return dProgress;
    }
}

export default Queries;
