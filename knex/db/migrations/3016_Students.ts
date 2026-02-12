import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Students', (table: any) => {
            table.uuid('sStudentId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sSchoolId').references('sSchoolId').inTable('Schools').notNullable();
            table.string('sName').notNullable().defaultTo('');
            table.string('sLastName').notNullable().defaultTo('');
            table.string('sSecondLastName').defaultTo('');
            table.integer('iBirthYear').defaultTo(0);
            table.string('sGrade').defaultTo('');
            table.string('sGroup').defaultTo('');
            table.text('sDiagnosis').defaultTo('');
            table.text('sNotes').defaultTo('');

            // Audit trail
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastDeletedBy').references('sUserId').inTable('Users').nullable();

            // Soft delete
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Students_sSchoolId_idx" ON "Students" ("sSchoolId")');
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Students_sGrade_idx" ON "Students" ("sGrade")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Students');
}
