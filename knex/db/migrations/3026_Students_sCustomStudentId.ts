import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Students', (table: any) => {
        table.string('sCustomStudentId', 50).defaultTo('');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Students', (table: any) => {
        table.dropColumn('sCustomStudentId');
    });
}
