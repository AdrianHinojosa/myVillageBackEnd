import * as Knex from "knex";

export async function up(Knex) : Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('SchoolPermissions', (table: any) => {
            table.uuid('sSchoolPermissionId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sSchoolUserId').references('sSchoolUserId').inTable('SchoolUsers').notNullable();
            table.uuid('sSchoolModuleId').references('sSchoolModuleId').inTable('SchoolModules').notNullable();
            table.enu('sActionCode', ['WRITE', 'READ', 'ADMIN', 'FORBIDDEN']).defaultTo('FORBIDDEN').notNullable();
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable('SchoolPermissions');
}
