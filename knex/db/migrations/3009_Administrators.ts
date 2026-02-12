import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Administrators', (table: any) => {
            table.uuid('sAdministratorId').references('sUserId').inTable('Users').primary().unique();
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Administrators');
}
