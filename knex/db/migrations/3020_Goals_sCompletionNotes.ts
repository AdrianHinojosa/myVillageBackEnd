import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.text('sCompletionNotes').defaultTo('');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.dropColumn('sCompletionNotes');
    });
}
