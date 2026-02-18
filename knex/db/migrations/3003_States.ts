import * as Knex from "knex";

export async function up(Knex): Promise<any> {
    return Knex.schema
        .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable("States", (table: any) => {
            table.uuid("sStateId").unique().defaultTo(Knex.raw("uuid_generate_v4()")).primary();
            table.string("sName").defaultTo("");
            table.string("sCode").defaultTo("");
            table.integer('iLegacyId').defaultTo(0);
            table.uuid("sCountryId").references("sCountryId").inTable("Countries");
            table.boolean('bActive').defaultTo(true);
            table.uuid('sLastDeletedBy').references('sUserId').inTable('Users').nullable();
            table.timestamps(true, true);
        });
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable("States");
}
