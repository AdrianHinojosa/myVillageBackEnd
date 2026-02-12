import * as Knex from "knex";

export async function up(Knex): Promise<any> {
    return Knex.schema
        .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable("Cities", (table: any) => {
            table.uuid("sCityId").unique().defaultTo(Knex.raw("uuid_generate_v4()")).primary();
            table.string('sName').defaultTo(null)
            table.string('sCode').nullable().defaultTo(null)
            table.integer('iLegacyId').defaultTo(0);           // 1-30000
            table.string('sCounty', 50).defaultTo("");
            table.decimal('dLatitude', 31, 15).defaultTo(0);
            table.decimal('dLongitude', 31, 15).defaultTo(0);
            table.boolean('bIsRamp').defaultTo(false);

            table.uuid('sStateId').references('sStateId').inTable('States');
            table.boolean('bActive').defaultTo(true)
            table.timestamps(true, true);
        });
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable("Cities");
}
