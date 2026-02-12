import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw(`CREATE EXTENSION IF NOT EXISTS unaccent;`)
}


export async function down(Knex): Promise<void> {
    return Knex.schema.raw(`DROP EXTENSION unaccent;`)
}
