import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('GoalFiles', (table: any) => {
            table.uuid('sGoalFileId').references('sFileId').inTable('Files').primary();
            table.uuid('sGoalId').references('sGoalId').inTable('Goals').notNullable();
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "GoalFiles_sGoalId_idx" ON "GoalFiles" ("sGoalId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('GoalFiles');
}
