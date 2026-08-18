/**
 * Recompute every goal's stored progress with the CURRENT rules.
 *
 *   npm run recalc:progress
 *
 * Why this exists: `Goals.dProgress`, `dAverageValue`, `iRecordsCount` and `tLastRecord` are a
 * **cache** of a calculation, written whenever a record or a subgoal changes. When the calculation
 * itself changes, every row written by the old rules is stale until something touches that goal
 * again — which for a finished goal is never.
 *
 * Two rule changes on 2026-08-18 (client, Lucy) made every existing row stale:
 *
 *   1. A goal's percentage now averages **all** its non-excluded records, not the last 3.
 *   2. A divided goal's percentage **mirrors its stage in progress** instead of averaging its stages.
 *
 * This calls the real engine (`recalculateGoalProgress` / `recalculateParentRollup`) rather than
 * reimplementing it in SQL, so a backfilled goal and a freshly captured one can never disagree —
 * duplicating a 140-line measurement engine that branches on 6 measurement types × 2 directions is
 * exactly how two sources of truth start drifting apart.
 *
 * Safe to re-run: it recomputes, it never invents data. Ordering matters and is handled — subgoals
 * are recalculated before their parents, and each subgoal recalculation rolls its parent up anyway.
 *
 * Also invoked automatically by migration `3039_Goals_recalculateProgressRules`, so a deploy does
 * not depend on anyone remembering to run it.
 */
require('dotenv').config();
import { db } from '../Config/Db.config';
import TrackingRecordQueries from '../Api/024_Goals/003_TrackingRecords/trackingRecords.queries';

export interface IRecalcResult {
    iGoals: number;
    iSubGoals: number;
    iParents: number;
    aChanged: Array<{ sTitle: string; dBefore: number; dAfter: number }>;
}

/**
 * @param oKnex  optional Knex/transaction to run inside — passed by the migration so the backfill
 *               shares the migration's transaction. Omitted on the CLI, which uses the app's pool.
 */
export async function recalculateAllProgress(oKnex?: any, bVerbose = true): Promise<IRecalcResult> {
    const oDb = oKnex || db;

    // Children first: a subgoal's own percentage must be right before its parent mirrors it.
    const oRows = await oDb.raw(`
        SELECT "sGoalId", "sParentGoalId", "bHasSubGoals", "dProgress", left("sTitle", 40) AS "sTitle"
        FROM myvillageschema."Goals"
        WHERE "bActive" = true
        ORDER BY ("sParentGoalId" IS NULL) ASC, "created_at" ASC
    `);

    const oResult: IRecalcResult = { iGoals: 0, iSubGoals: 0, iParents: 0, aChanged: [] };

    for (const oRow of oRows.rows) {
        const dBefore = Number(oRow.dProgress) || 0;

        if (oRow.sParentGoalId) {
            // A subgoal: recalculating it also rolls its parent up.
            const dAfter = await TrackingRecordQueries.recalculateGoalProgress(oRow.sGoalId, oKnex);
            oResult.iSubGoals++;
            if (Math.abs(Number(dAfter) - dBefore) > 0.005) {
                oResult.aChanged.push({ sTitle: oRow.sTitle, dBefore, dAfter: Number(dAfter) });
            }
        } else if (oRow.bHasSubGoals) {
            // A divided goal owns no records: its figure comes entirely from its stages.
            const dAfter = await TrackingRecordQueries.recalculateParentRollup(oRow.sGoalId, oKnex);
            oResult.iParents++;
            if (Math.abs(Number(dAfter) - dBefore) > 0.005) {
                oResult.aChanged.push({ sTitle: oRow.sTitle, dBefore, dAfter: Number(dAfter) });
            }
        } else {
            const dAfter = await TrackingRecordQueries.recalculateGoalProgress(oRow.sGoalId, oKnex);
            oResult.iGoals++;
            if (Math.abs(Number(dAfter) - dBefore) > 0.005) {
                oResult.aChanged.push({ sTitle: oRow.sTitle, dBefore, dAfter: Number(dAfter) });
            }
        }
    }

    if (bVerbose) {
        console.log(`  plain goals    : ${oResult.iGoals}`);
        console.log(`  subgoals       : ${oResult.iSubGoals}`);
        console.log(`  divided goals  : ${oResult.iParents}`);
        console.log(`  changed        : ${oResult.aChanged.length}`);
        for (const oChange of oResult.aChanged) {
            console.log(`    ${oChange.sTitle.padEnd(42)} ${oChange.dBefore}% → ${oChange.dAfter}%`);
        }
    }

    return oResult;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (require.main === module) {
    (async () => {
        const oDbRow = await db.raw('select current_database() as db');
        console.log(`\n═══ Recalculating goal progress ═══\n`);
        console.log(`  database       : ${oDbRow.rows[0].db}\n`);

        try {
            await recalculateAllProgress();
            console.log('\n  done\n');
            process.exit(0);
        } catch (error: any) {
            console.error(`\n  FAILED — ${error.message}\n`);
            process.exit(1);
        }
    })();
}
