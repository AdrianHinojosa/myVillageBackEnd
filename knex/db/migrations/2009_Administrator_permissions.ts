import * as Knex from "knex";

export async function up(Knex) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('AdministratorPermissions', (table: any) => {
            table.uuid('sAdministratorPermissionId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sAdministratorId').references('sAdministratorId').inTable('Administrators').notNullable();
            table.uuid('sAdministratorModuleId').references('sAdministratorModuleId').inTable('AdministratorModules').notNullable();
            table.enu('sActionCode', ['WRITE', 'READ', 'DELETE', 'FORBIDDEN']).defaultTo('FORBIDDEN').notNullable();
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable('AdministratorPermissions');
}