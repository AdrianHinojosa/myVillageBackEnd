import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('IEPs', (table: any) => {
            table.uuid('sIepId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sStudentId').references('sStudentId').inTable('Students').notNullable();
            table.string('sStatus').defaultTo('DRAFT'); // DRAFT, ACTIVE, ARCHIVED

            // External Services
            table.jsonb('aExternalServices').defaultTo('[]');

            // Parents
            table.text('sParentNames').defaultTo('');
            table.text('sParentConcerns').defaultTo('');

            // School Assignment
            table.string('sSchoolAssignment').defaultTo('');
            table.text('sSchoolAssignmentOther').defaultTo('');

            // Student Profile
            table.text('sStrengths').defaultTo('');
            table.text('sAreasOfOpportunity').defaultTo('');

            // Academic Performance
            table.text('sCognitiveEvaluations').defaultTo('');
            table.text('sSubjectGrades').defaultTo('');
            table.text('sEvaluationResults').defaultTo('');

            // Functional Performance
            table.text('sCommunicationComments').defaultTo('');
            table.text('sMotorComments').defaultTo('');
            table.text('sSocioemotionalComments').defaultTo('');
            table.text('sIndependenceComments').defaultTo('');

            // Focus Areas
            table.jsonb('aFocusAreas').defaultTo('[]');
            table.text('sFocusAreasSubjects').defaultTo('');

            // Accommodations
            table.jsonb('aAccommodations').defaultTo('[]');
            table.text('sOtherAccommodations').defaultTo('');

            // Modifications
            table.boolean('bRequiresModifications').defaultTo(false);
            table.jsonb('aModifications').defaultTo('[]');

            // Objectives
            table.jsonb('aObjectives').defaultTo('[]');

            // Audit
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamp('tDeletedAt').nullable();
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "IEPs_sStudentId_idx" ON "IEPs" ("sStudentId")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('IEPs');
}
