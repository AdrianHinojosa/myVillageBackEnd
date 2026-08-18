import * as Knex from "knex";

/**
 * P7 — sequential subgoals and the new average window (client, Lucy, 2026-08-18).
 *
 * No schema change. This migration repairs DATA that the two new rules made invalid:
 *
 * ── 1. THE SEQUENTIAL INVARIANT ────────────────────────────────────────────────────────────────
 * Subgoals used to have independent statuses, so a goal could have Etapa 1, 2 and 3 all `ACTIVE`.
 * The goal's percentage now mirrors "the stage in progress", and that phrase only has one answer if
 * only one stage can be in progress. Existing rows are normalised: per goal, the FIRST unfinished
 * stage (by `iOrder`, then `created_at`) keeps `ACTIVE`; every other unfinished stage becomes
 * `PAUSED`. Closed stages (`COMPLETED` / `NOT_ACHIEVED`) are never touched — they are history.
 *
 * ── 2. THE CACHED PERCENTAGES ──────────────────────────────────────────────────────────────────
 * `dProgress` / `dAverageValue` / `iRecordsCount` / `tLastRecord` are a cache of a calculation, and
 * both rules behind that calculation changed: a goal now averages ALL its records instead of the
 * last 3, and a divided goal mirrors its current stage instead of averaging its stages. Rows written
 * by the old rules stay wrong until something touches that goal again, which for a finished goal is
 * never — so they are recomputed here.
 *
 * The recomputation calls the application's own engine
 * (`src/scripts/recalculateProgress.ts` → `recalculateGoalProgress` / `recalculateParentRollup`)
 * instead of reimplementing it in SQL. Reproducing a 140-line engine that branches on 6 measurement
 * types × 2 directions as a wall of CASE statements is how two sources of truth start disagreeing.
 *
 * The trade-off of importing application code into a migration is that a future refactor could move
 * that file and break `migrate:latest` for a fresh database. That is why the call is wrapped: if the
 * module cannot be loaded, the migration logs a warning and completes. Nothing is lost — a fresh
 * database has no goals to recompute, and an existing one can be fixed any time with
 * `npm run recalc:progress`, which is the same code path.
 *
 * Idempotent: normalising an already-normal set of stages is a no-op, and recomputing a cache twice
 * yields the same values.
 */
export async function up(Knex): Promise<void> {
    // ---- 1. one stage in progress per goal -------------------------------------------------
    await Knex.raw(`
        WITH ranked AS (
            SELECT "sGoalId",
                   row_number() OVER (
                       PARTITION BY "sParentGoalId"
                       ORDER BY "iOrder" ASC, "created_at" ASC
                   ) AS rn
            FROM myvillageschema."Goals"
            WHERE "sParentGoalId" IS NOT NULL
              AND "bActive" = true
              AND ("sStatus" IS NULL OR "sStatus" NOT IN ('COMPLETED', 'NOT_ACHIEVED'))
        )
        UPDATE myvillageschema."Goals" g
        SET "sStatus" = CASE WHEN r.rn = 1 THEN 'ACTIVE' ELSE 'PAUSED' END
        FROM ranked r
        WHERE g."sGoalId" = r."sGoalId"
          AND g."sStatus" IS DISTINCT FROM (CASE WHEN r.rn = 1 THEN 'ACTIVE' ELSE 'PAUSED' END)
    `);

    // ---- 2. recompute the cached figures with the new rules ---------------------------------
    try {
        // Required lazily and inside the try: see the note above about coupling a migration to
        // application code.
        const { recalculateAllProgress } = require('../../../src/scripts/recalculateProgress');
        const oResult = await recalculateAllProgress(Knex, false);
        console.log(
            `  3039: recomputed ${oResult.iGoals} goal(s), ${oResult.iSubGoals} subgoal(s), ` +
            `${oResult.iParents} divided goal(s) — ${oResult.aChanged.length} value(s) changed`
        );
    } catch (error: any) {
        console.warn(
            `  3039: could not run the progress recomputation (${error.message}). ` +
            `The schema is unaffected. Run "npm run recalc:progress" to complete it.`
        );
    }
}

/**
 * No-op. Both halves repair derived data — a status normalisation that cannot be un-guessed (the
 * previous per-stage statuses are not recoverable) and a cache the runtime rewrites on the next
 * record. Reversing either would only reintroduce the inconsistency this migration removes.
 */
export async function down(Knex): Promise<void> {
    return;
}
