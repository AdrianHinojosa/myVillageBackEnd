import * as Knex from "knex";

export async function up(Knex: any) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('SchoolModuleCategories', (table: any) => {
            table.uuid('sSchoolModuleCategoryId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sIcon').defaultTo('');
            table.string('sNameSP').defaultTo('');
            table.string('sNameEN').defaultTo('');
            table.text('sDescriptionSP').defaultTo('');
            table.text('sDescriptionEN').defaultTo('');
            table.timestamps(true, true);
        })
}

export async function down(Knex: any): Promise<any> {
    return Knex.schema.dropTable('SchoolModuleCategories');
}
