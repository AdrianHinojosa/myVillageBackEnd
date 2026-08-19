import * as Knex from "knex";

/**
 * Punto 5 — Adaptación de la plataforma para Terapeutas.
 *
 * An account is either a school (the existing behaviour) or a single therapist. In THERAPIST mode
 * the frontend reworks the terminology and hides IEP, document upload and user creation; the
 * backend records the type, exposes it at login, and enforces the restrictions server-side.
 *
 * Defaults to 'SCHOOL' so every existing row keeps behaving exactly as it does today.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.string('sAccountType').notNullable().defaultTo('SCHOOL'); // SCHOOL | THERAPIST
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.dropColumn('sAccountType');
    });
}
