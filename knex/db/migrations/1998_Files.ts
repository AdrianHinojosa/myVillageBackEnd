import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Files', (table: any) => {
            table.uuid('sFileId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            // File Data
            table.string('sFolio').defaultTo('');
            table.string('sFileName').defaultTo('');
            table.string('sFileKey').defaultTo('');
            table.string('sFileType').defaultTo('');
            // See who has edited
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            // Check if active
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Files');
}