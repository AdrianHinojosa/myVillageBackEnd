import * as Knex from "knex";

export async function up(Knex): Promise<any> {
    return Knex.schema
        .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable("States", (table: any) => {
            table.uuid("sStateId").unique().defaultTo(Knex.raw("uuid_generate_v4()")).primary();
            table.string("sName").defaultTo("");
            table.string("sCode").defaultTo("");
            table.integer('iLegacyId').defaultTo(0);      // 1-52 in the original file
            table.uuid("sCountryId").references("sCountryId").inTable("Countries");
            table.boolean('bActive').defaultTo(true)
            table.timestamps(true, true);
        });
}

export async function down(knex: any): Promise<any> {
    return knex.schema.dropTable("States");
}
