import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('SchoolUsers', (table: any) => {
            table.uuid('sSchoolUserId').references('sUserId').inTable('Users').primary().unique();
            table.uuid('sSchoolId').references('sSchoolId').inTable('Schools');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('SchoolUsers');
}
