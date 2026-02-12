import * as Knex from "knex";

export async function up(Knex): Promise<any> {
    return Knex.schema
        .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable("Countries", (table: any) => {
            table.uuid("sCountryId").unique().defaultTo(Knex.raw("uuid_generate_v4()")).primary();
            table.string("sName").defaultTo(null);
            table.string("sCode").defaultTo(null);
            table.boolean('bActive').defaultTo(true);
            table.uuid('sLastDeletedBy').references('sUserId').inTable('Users').nullable();
            table.timestamps(true, true);
        });
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable("Countries");
}
