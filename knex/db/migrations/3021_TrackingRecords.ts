import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('TrackingRecords', (table: any) => {
            table.uuid('sTrackingRecordId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sGoalId').references('sGoalId').inTable('Goals').notNullable();
            table.uuid('sGoalTaskId').references('sGoalTaskId').inTable('GoalTasks').nullable();
            table.date('tRecordDate').nullable();
            table.string('sSupportUsed').defaultTo(''); // INDEPENDENT|GENERAL|VISUAL|VERBAL|WRITTEN|GESTURAL|MODELING|PHYSICAL
            table.text('sObservations').defaultTo('');
            table.integer('iHits').nullable();
            table.integer('iErrors').nullable();
            table.integer('iScaleValue').nullable();
            table.integer('iOccurrences').nullable();
            table.integer('iDurationMinutes').nullable();
            table.integer('iAchieved').nullable();
            table.integer('iTotal').nullable();
            table.boolean('bExcludedFromAverage').defaultTo(false);

            // Audit trail
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();

            // Soft delete
            table.boolean('bActive').defaultTo(true);
            table.timestamp('tDeletedAt').nullable();
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "TrackingRecords_sGoalId_idx" ON "TrackingRecords" ("sGoalId")');
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "TrackingRecords_tRecordDate_idx" ON "TrackingRecords" ("tRecordDate")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('TrackingRecords');
}
