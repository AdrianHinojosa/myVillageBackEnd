import * as Knex from "knex";

/**
 * P7 — backfill of the subgoal roll-up (Lucy's feedback, 2026-08-17).
 *
 * A divided goal keeps its tracking records in its SUBGOALS, so its own `dProgress`,
 * `iRecordsCount` and `tLastRecord` stayed at their defaults forever. Every screen that reads those
 * stored columns — the goal card, the student dashboard, the PDF report and `iGoalProgress` in
 * `/schools/analytics` — therefore showed 0% for a goal whose stages were at, say, 91%.
 *
 * `recalculateParentRollup()` now maintains those columns whenever a record, a subgoal or a delete
 * moves, but only from here forward. Goals created before that code shipped need one recomputation,
 * and that is all this migration does — no schema change, no destructive write.
 *
 * RULE (PO decision 2026-08-14, kept identical to the runtime function so a backfilled goal and a
 * recalculated one cannot disagree):
 *   dProgress      = average of dProgress across ALL active subgoals, capped at 100.
 *                    A subgoal with no records counts as 0, it is not skipped.
 *   dAverageValue  = same average over dAverageValue (NULL counts as 0).
 *   iRecordsCount  = SUM across subgoals — "how much has been logged" answered at the parent.
 *   tLastRecord    = the most recent of them.
 *
 * `bHasSubGoals` is repaired in the same pass, but only ever set to TRUE: a goal can legitimately be
 * flagged as divided before its first subgoal exists (the UI creates the goal, then the stages), so
 * clearing the flag on a childless goal would break that window.
 *
 * Idempotent: running it twice recomputes the same values.
 */
export async function up(Knex): Promise<void> {
    await Knex.raw(`
        UPDATE "Goals" p
        SET "dProgress"     = r."dProgress",
            "dAverageValue" = r."dAverageValue",
            "iRecordsCount" = r."iRecordsCount",
            "tLastRecord"   = r."tLastRecord",
            "bHasSubGoals"  = true
        FROM (
            SELECT c."sParentGoalId",
                   LEAST(ROUND(AVG(COALESCE(c."dProgress", 0))::numeric, 2), 100) AS "dProgress",
                   ROUND(AVG(COALESCE(c."dAverageValue", 0))::numeric, 2)         AS "dAverageValue",
                   COALESCE(SUM(COALESCE(c."iRecordsCount", 0)), 0)::integer      AS "iRecordsCount",
                   MAX(c."tLastRecord")                                           AS "tLastRecord"
            FROM "Goals" c
            WHERE c."sParentGoalId" IS NOT NULL
              AND c."bActive" = true
            GROUP BY c."sParentGoalId"
        ) r
        WHERE p."sGoalId" = r."sParentGoalId"
          AND p."bActive" = true
    `);
}

/**
 * Nothing to undo: the columns are derived values that the runtime recomputes on the next record.
 * Zeroing them out would only reintroduce the bug this migration fixes, so `down` is a no-op — the
 * same choice the project makes for other data-only migrations.
 */
export async function down(Knex): Promise<void> {
    return;
}
