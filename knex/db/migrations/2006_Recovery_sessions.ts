import * as Knex from "knex";

export async function up(Knex) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('RecoverySessions', (table: any) => {
            table.uuid('sRecoverySessionId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            // We'll add the sUserId column using standard Knex methods first
            table.uuid('sUserId'); // LATER Reference users.
            table.string('sToken').notNullable();
            table.boolean('bActive').defaultTo(true)
            table.timestamp('tExpiresAt').defaultTo(Knex.fn.now());
            table.timestamps(true, true);
        })
        .then(() => {
            // Now we'll add the foreign key constraint with raw SQL
            return Knex.raw(`ALTER TABLE "RecoverySessions" ADD CONSTRAINT "recoverysessions_suserid_foreign" FOREIGN KEY ("sUserId") REFERENCES "Users"("sUserId") MATCH FULL`);
        });
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable('RecoverySessions');
}