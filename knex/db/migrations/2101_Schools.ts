import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Schools', (table: any) => {
            table.uuid('sSchoolId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sName').notNullable();
            table.string('sAdminEmail').notNullable();
            table.string('sAdminName').defaultTo('');
            table.string('sAdminPhone').defaultTo('');
            table.string('sLogoKey').defaultTo('');
            // Email verification
            table.boolean('bVerified').defaultTo(false);
            // Check if active
            table.boolean('bActive').defaultTo(true);
            // Soft delete
            table.timestamp('tDeletedAt').defaultTo(null);
            table.timestamps(true, true);

            // Unique constraints
            table.unique(['sName'], 'Schools_sName_unique');
            table.unique(['sAdminEmail'], 'Schools_sAdminEmail_unique');

            // Create indexes
            table.index(['sName'], 'Schools_sName_idx');
            table.index(['sAdminEmail'], 'Schools_sAdminEmail_idx');
            table.index(['tDeletedAt'], 'Schools_tDeletedAt_idx');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Schools');
}
