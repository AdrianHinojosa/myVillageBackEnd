import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.integer('iBaselineValue').defaultTo(10);
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.dropColumn('iBaselineValue');
    });
}
