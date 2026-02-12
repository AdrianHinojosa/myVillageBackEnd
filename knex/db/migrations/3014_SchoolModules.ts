import * as Knex from "knex";

export async function up(Knex: any) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    .createTable('SchoolModules', (table: any) => {
            table.uuid('sSchoolModuleId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sSchoolModuleCategoryId').references('sSchoolModuleCategoryId').inTable('SchoolModuleCategories');
            /*
                -- iType: --
                0: Ver, Editar y super admin
                1: Ver, Editar
                2: Ver, Borrar
                3: Ver
            */
            table.integer('iType').defaultTo(0);
            table.string('sUniqueName').defaultTo('');
            table.string('sNameSP').defaultTo('');
            table.string('sNameEN').defaultTo('');
            table.text('sDescriptionSP').defaultTo('');
            table.text('sDescriptionEN').defaultTo('');
            table.timestamps(true, true);
        })
}

export async function down(Knex: any): Promise<any> {
    return Knex.schema.dropTable('SchoolModules');
}
