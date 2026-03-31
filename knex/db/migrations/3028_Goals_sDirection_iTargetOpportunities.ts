import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.string('sDirection', 10).defaultTo('INCREASE');
        table.integer('iTargetOpportunities').nullable();
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.dropColumn('sDirection');
        table.dropColumn('iTargetOpportunities');
    });
}
