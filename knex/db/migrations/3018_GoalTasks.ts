import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('GoalTasks', (table: any) => {
            table.uuid('sGoalTaskId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sGoalId').references('sGoalId').inTable('Goals').notNullable();
            table.string('sTitle').defaultTo('');
            table.boolean('bCompleted').defaultTo(false);
            table.integer('iOrder').defaultTo(0);
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "GoalTasks_sGoalId_idx" ON "GoalTasks" ("sGoalId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('GoalTasks');
}
