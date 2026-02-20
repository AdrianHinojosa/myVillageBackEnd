import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Goals', (table: any) => {
            table.uuid('sGoalId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sStudentId').references('sStudentId').inTable('Students').notNullable();
            table.string('sTitle').notNullable().defaultTo('');
            table.text('sDescription').defaultTo('');
            table.string('sMeasurementType').notNullable(); // EXACTITUD, TAREAS, ESCALA, FRECUENCIA, DURACION, OPORTUNIDAD
            table.string('sStatus').defaultTo('ACTIVE'); // ACTIVE, COMPLETED, NOT_ACHIEVED, PAUSED
            table.date('tStartDate').nullable();
            table.date('tTargetDate').nullable();
            table.date('tCompletedDate').nullable();
            table.text('sCompletionNotes').defaultTo('');
            table.integer('iTargetValue').nullable();
            table.integer('iTargetDuration').nullable();
            table.integer('iScaleMin').nullable();
            table.integer('iScaleMax').nullable();
            table.string('sFrequencyUnit').defaultTo('');
            table.decimal('dProgress', 5, 2).defaultTo(0);
            table.decimal('dAverageValue', 10, 2).nullable();
            table.integer('iRecordsCount').defaultTo(0);
            table.timestamp('tLastRecord').nullable();

            // Audit trail
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastDeletedBy').references('sUserId').inTable('Users').nullable();

            // Soft delete
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Goals_sStudentId_idx" ON "Goals" ("sStudentId")');
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Goals_sStatus_idx" ON "Goals" ("sStatus")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Goals');
}
