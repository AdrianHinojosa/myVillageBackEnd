import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('StudentAssignments', (table: any) => {
            table.uuid('sStudentAssignmentId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sStudentId').references('sStudentId').inTable('Students').notNullable();
            table.uuid('sSchoolUserId').references('sSchoolUserId').inTable('SchoolUsers').notNullable();
            table.unique(['sStudentId', 'sSchoolUserId']);
            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw(`
                CREATE INDEX "StudentAssignments_sStudentId_idx" ON "StudentAssignments"("sStudentId");
                CREATE INDEX "StudentAssignments_sSchoolUserId_idx" ON "StudentAssignments"("sSchoolUserId");
            `);
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('StudentAssignments');
}
