import * as Knex from "knex";

/**
 * Punto 18 — My Village for You / You+.
 *
 * `bTrialConsumed`: la prueba se otorga UNA sola vez por cuenta. Una cuenta que ya la consumió y
 * vuelve a suscribirse inicia su cobro de inmediato (sin nuevo periodo de prueba).
 *
 * ADITIVA y con default: los colegios en vivo (SCHOOL) no se ven afectados — arrancan en `false`
 * y su comportamiento no cambia. Los tiers de You/You+ (base, incluidos, excedentes) viven como
 * constantes en `src/Services/Stripe.service.ts`, no como columnas.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.boolean('bTrialConsumed').notNullable().defaultTo(false);
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.dropColumn('bTrialConsumed');
    });
}
