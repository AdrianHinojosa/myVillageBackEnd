import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.date('dtIepStartDate').nullable();
        table.date('dtIepReviewDate').nullable();
        table.text('sNotes').defaultTo('');
        table.jsonb('aTeamMembers').defaultTo('[]');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.dropColumn('dtIepStartDate');
        table.dropColumn('dtIepReviewDate');
        table.dropColumn('sNotes');
        table.dropColumn('aTeamMembers');
    });
}
