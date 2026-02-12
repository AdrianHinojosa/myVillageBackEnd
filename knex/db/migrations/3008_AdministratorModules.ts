import * as Knex from "knex";

export async function up(Knex: any) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('AdministratorModules', (table: any) => {
            table.uuid('sAdministratorModuleId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sName').defaultTo('');
            table.text('sDescriptionSP').defaultTo('');
            table.text('sDescriptionEN').defaultTo('');
            table.timestamps(true, true);
        })
}

export async function down(Knex: any): Promise<any> {
    return Knex.schema.dropTable('AdministratorModules');
}
