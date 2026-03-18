import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('TrackingRecordTasks', (table: any) => {
            table.uuid('sTrackingRecordTaskId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sTrackingRecordId').references('sTrackingRecordId').inTable('TrackingRecords').notNullable();
            table.uuid('sGoalTaskId').references('sGoalTaskId').inTable('GoalTasks').notNullable();
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "TrackingRecordTasks_sTrackingRecordId_idx" ON "TrackingRecordTasks" ("sTrackingRecordId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('TrackingRecordTasks');
}
