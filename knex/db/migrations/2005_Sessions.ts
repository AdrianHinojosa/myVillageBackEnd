import * as Knex from "knex";

export async function up(Knex) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Sessions', (table: any) => {
            table.uuid('sSessionId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sUserId').references('sUserId').inTable('Users');
            table.boolean('bActive').defaultTo(true);
            table.timestamp('tExpiresAt').defaultTo(null);
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable('Sessions');
}