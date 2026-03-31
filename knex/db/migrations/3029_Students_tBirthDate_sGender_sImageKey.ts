import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Students', (table: any) => {
        table.date('tBirthDate').nullable();
        table.string('sGender', 2).defaultTo('');
        table.string('sImageKey', 255).nullable();
    }).then(() => {
        // Backfill tBirthDate from iBirthYear where available
        return Knex.raw(`UPDATE "Students" SET "tBirthDate" = make_date("iBirthYear", 1, 1) WHERE "iBirthYear" IS NOT NULL AND "iBirthYear" > 0`);
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Students', (table: any) => {
        table.dropColumn('tBirthDate');
        table.dropColumn('sGender');
        table.dropColumn('sImageKey');
    });
}
