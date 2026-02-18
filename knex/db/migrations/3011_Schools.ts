import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Schools', (table: any) => {
            table.uuid('sSchoolId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sName').defaultTo('');
            table.string('sImageKey').defaultTo('');
            table.string('sPhone').defaultTo('');
            table.string('sEmail').defaultTo('');
            table.text('sAddress').defaultTo('');
            table.uuid('sCityId').references('sCityId').inTable('Cities').nullable();
            table.integer('iUsersLimit').defaultTo(0);
            table.integer('iStudentsLimit').defaultTo(0);
            table.boolean('bBlocked').defaultTo(false);

            // Audit trail
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastDeletedBy').references('sUserId').inTable('Users').nullable();

            // Soft delete
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Schools');
}
