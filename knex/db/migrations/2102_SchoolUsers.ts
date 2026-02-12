import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    await Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "unaccent";');

    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('SchoolUsers', (table: any) => {
            table.uuid('sSchoolUserId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sSchoolId').references('sSchoolId').inTable('Schools');
            // User Data
            table.string('sEmail').notNullable();
            table.string('sPassword').nullable().defaultTo(null);
            table.string('sName').defaultTo('');
            table.string('sLastName').defaultTo('');
            table.string('sSecondLastName').defaultTo('');
            table.string('sPhoneNumber').defaultTo('');
            table.string('sPhoneExtension').defaultTo('');
            table.string('sImageKey').defaultTo('');
            /*
                -- sType: --
                FACULTY: Maestros/Docentes
                ADMINISTRATION: Personal administrativo
            */
            table.string('sType').defaultTo('');
            // Email/Password verification
            table.boolean('bVerified').defaultTo(false);
            // Recursive relations (self-referencing added later)
            table.uuid('sCreatedBy').defaultTo(null);
            table.uuid('sLastUpdatedBy').defaultTo(null);
            // Check if active
            table.boolean('bActive').defaultTo(true);
            // Soft delete
            table.timestamp('tDeletedAt').defaultTo(null);
            table.timestamps(true, true);

            // Unique constraint: email unique per school
            table.unique(['sSchoolId', 'sEmail'], 'SchoolUsers_sSchoolId_sEmail_unique');

            // Create indexes
            table.index(['sSchoolId'], 'SchoolUsers_sSchoolId_idx');
            table.index(['sEmail'], 'SchoolUsers_sEmail_idx');
            table.index(['tDeletedAt'], 'SchoolUsers_tDeletedAt_idx');
        })
        .then(() => {
            // Add self-referencing foreign keys
            return Knex.raw(`
                ALTER TABLE "SchoolUsers"
                ADD CONSTRAINT "schoolusers_screatedby_foreign"
                FOREIGN KEY ("sCreatedBy") REFERENCES "SchoolUsers"("sSchoolUserId") MATCH FULL;

                ALTER TABLE "SchoolUsers"
                ADD CONSTRAINT "schoolusers_slastupdatedby_foreign"
                FOREIGN KEY ("sLastUpdatedBy") REFERENCES "SchoolUsers"("sSchoolUserId") MATCH FULL;
            `);
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('SchoolUsers');
}
