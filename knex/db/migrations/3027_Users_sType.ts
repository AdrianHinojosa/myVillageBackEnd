import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Users', (table: any) => {
        table.string('sType').defaultTo('FACULTY');
    }).then(() => {
        // Backfill: users with sCreatedBy IS NULL are ADMINISTRATION (main admins)
        return Knex.raw(`UPDATE "Users" SET "sType" = 'ADMINISTRATION' WHERE "sCreatedBy" IS NULL`);
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Users', (table: any) => {
        table.dropColumn('sType');
    });
}
