import * as Knex from "knex";

export async function up(Knex) : Promise<void> {
    // ADD UNACCENT Extension
    await Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "unaccent";');
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Users', (table: any) => {
            table.uuid('sUserId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sName').defaultTo('');
            table.string('sLastName').defaultTo('');
            table.string('sSecondLastName').defaultTo('');
            table.string('sEmail').notNullable();
            table.string('sPassword').nullable().defaultTo(null);
            table.string('sImageKey').defaultTo('');
            // Phone Number
            table.string('sPhoneNumber').defaultTo('');
            table.string('sPhoneExtension').defaultTo('');
            table.boolean('bPlatformAccess').defaultTo(false);
            // Boolean to check if the email is verified
            table.boolean('bVerified').defaultTo(false);
            
            // Recursive relations
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();

            // Check if active
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
}

export async function down(Knex): Promise<any> {
    return Knex.schema.dropTable('Users');
}