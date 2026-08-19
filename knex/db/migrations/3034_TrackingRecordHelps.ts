import * as Knex from "knex";

/**
 * Punto 8 — Tipos de ayuda.
 *
 * One tracking record can document SEVERAL kinds of support, each with its own 0-10 value
 * (e.g. Visual 8, Verbal 7, Escrita 6), so they cannot live in a column on TrackingRecords.
 * A child table keeps this queryable for reports; eight fixed columns would not be.
 *
 * Purely documental — nothing here feeds progress, average or record-count calculations.
 *
 * NOTE: TrackingRecords.sSupportUsed (added in 3021) holds a SINGLE value and is superseded by
 * this table. It is deliberately left in place: it has never been written to, and dropping a
 * column from a live schema is irreversible and needs its own approval.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('TrackingRecordHelps', (table: any) => {
            table.uuid('sTrackingRecordHelpId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sTrackingRecordId').references('sTrackingRecordId').inTable('TrackingRecords').notNullable();

            // INDEPENDENT|GENERAL|VISUAL|VERBAL|WRITTEN|GESTURAL|MODELING|PHYSICAL
            table.string('sHelpType').notNullable();
            // How much support of this type was given, 0-10.
            table.integer('iHelpAmount').notNullable().defaultTo(0);

            // Audit trail
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();

            table.timestamps(true, true);

            // One row per help type per record — enforced by the database, not just by Joi.
            table.unique(['sTrackingRecordId', 'sHelpType'], 'TrackingRecordHelps_record_type_unq');
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "TrackingRecordHelps_sTrackingRecordId_idx" ON "TrackingRecordHelps" ("sTrackingRecordId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('TrackingRecordHelps');
}
