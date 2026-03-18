import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('TrackingRecordFiles', (table: any) => {
            table.uuid('sTrackingRecordFileId').references('sFileId').inTable('Files').primary();
            table.uuid('sTrackingRecordId').references('sTrackingRecordId').inTable('TrackingRecords').notNullable();
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "TrackingRecordFiles_sTrackingRecordId_idx" ON "TrackingRecordFiles" ("sTrackingRecordId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('TrackingRecordFiles');
}
