import * as Knex from "knex";

/**
 * Punto 7 — Metas con submetas.
 *
 * A subgoal IS a goal: same fields, same records, same chart, same measurement maths. So instead of
 * a parallel `SubGoals` table it becomes a `Goals` row pointing at its parent. That way
 * `recalculateGoalProgress()` (the ~140-line engine branching on 6 measurement types x 2
 * directions), `GoalTasks`, `GoalFiles` and the whole TrackingRecords pipeline serve subgoals with
 * no duplication — one engine, so a fix applies to both.
 *
 * The cost of this choice is that EVERY query listing or aggregating goals must exclude children,
 * or subgoals would show up as top-level goals and be double-counted in analytics. Those guards go
 * in with this migration, before any subgoal can exist. See the migration notes in
 * documentationForFront/NewScopeAug2026/implementationTracket.md.
 *
 * Only one level of nesting is allowed (a subgoal cannot have subgoals) — enforced in the
 * controller, since a partial self-referencing constraint cannot express it.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        // NULL = a top-level goal. Set = this row is a subgoal of that goal.
        table.uuid('sParentGoalId').references('sGoalId').inTable('Goals').nullable();

        // Display order of subgoals within their parent. Not user-reorderable (PO decision).
        table.integer('iOrder').defaultTo(0);

        // True when the goal is divided. Stored rather than derived because the frontend marks a
        // goal as divided at creation time, BEFORE any subgoal exists — deriving it from a child
        // count would report false during that window and the UI would show the wrong screen.
        table.boolean('bHasSubGoals').defaultTo(false);

        // Listed in the scope document ("porcentaje objetivo, 0 a 100") but missing from Goals.
        // Added here for goals and subgoals alike, since a subgoal is a Goals row.
        table.integer('iTargetPercentage').nullable();
    })
    .then(() => {
        return Knex.schema.raw('CREATE INDEX "Goals_sParentGoalId_idx" ON "Goals" ("sParentGoalId")');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.raw('DROP INDEX IF EXISTS "Goals_sParentGoalId_idx"')
        .then(() => {
            return Knex.schema.alterTable('Goals', (table: any) => {
                table.dropColumn('sParentGoalId');
                table.dropColumn('iOrder');
                table.dropColumn('bHasSubGoals');
                table.dropColumn('iTargetPercentage');
            });
        });
}
