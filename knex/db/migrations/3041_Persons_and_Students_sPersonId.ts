import * as Knex from "knex";

/**
 * Feature 2 — Alumno compartido entre instituciones.
 *
 * Un alumno puede existir en varias instituciones compartiendo SOLO su identidad
 * (nombre + fecha de nacimiento). Todo lo demás (diagnóstico, grado, metas, registros)
 * sigue siendo POR institución: cada colegio tiene su propia fila en `Students`.
 *
 * Modelo: una entidad compartida `Persons` (la identidad del niño, con el "folio" = sPersonId),
 * y `Students.sPersonId` que apunta a ella. Dos filas de `Students` con el mismo `sPersonId`
 * son el mismo niño en distintas instituciones — la base para el futuro "My Village Parents"
 * (un hijo, no un hijo por organización).
 *
 * Backfill: cada alumno existente genera su propia Person, reusando su `sStudentId` como
 * `sPersonId` (folio). Así todo alumno actual queda con un folio estable y el comportamiento
 * previo no cambia.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        // Identidad compartida del niño (solo lo que se comparte entre instituciones).
        .createTable('Persons', (table: any) => {
            table.uuid('sPersonId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sName').notNullable();
            table.string('sLastName').notNullable();
            table.string('sSecondLastName').defaultTo('');
            table.date('tBirthDate').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        })
        // Enlace del perfil por institución a su identidad compartida.
        .then(() => Knex.schema.alterTable('Students', (table: any) => {
            table.uuid('sPersonId').references('sPersonId').inTable('Persons').nullable();
        }))
        .then(() => Knex.schema.raw('CREATE INDEX "Students_sPersonId_idx" ON "Students" ("sPersonId")'))
        // Un colegio no puede ligar dos veces al mismo niño (evita duplicados en carrera).
        .then(() => Knex.schema.raw('CREATE UNIQUE INDEX "Students_sSchoolId_sPersonId_uidx" ON "Students" ("sSchoolId", "sPersonId") WHERE "bActive" = true'))
        // Backfill: una Person por cada alumno ACTIVO, reusando su id como folio. Los soft-deleted
        // (bActive=false) no reciben identidad — no deben ser vinculables por otras instituciones.
        .then(() => Knex.schema.raw(`
            INSERT INTO "Persons" ("sPersonId", "sName", "sLastName", "sSecondLastName", "tBirthDate", "bActive")
            SELECT "sStudentId", "sName", "sLastName", COALESCE("sSecondLastName", ''), "tBirthDate", true
            FROM "Students" WHERE "bActive" = true
        `))
        .then(() => Knex.schema.raw(`UPDATE "Students" SET "sPersonId" = "sStudentId" WHERE "sPersonId" IS NULL AND "bActive" = true`));
}

export async function down(Knex): Promise<void> {
    return Knex.schema.raw('DROP INDEX IF EXISTS "Students_sSchoolId_sPersonId_uidx"')
        .then(() => Knex.schema.raw('DROP INDEX IF EXISTS "Students_sPersonId_idx"'))
        .then(() => Knex.schema.alterTable('Students', (table: any) => {
            table.dropColumn('sPersonId');
        }))
        .then(() => Knex.schema.dropTable('Persons'));
}
