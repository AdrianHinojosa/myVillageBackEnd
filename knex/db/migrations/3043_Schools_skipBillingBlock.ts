import * as Knex from "knex";

/**
 * Feature — Override manual "Omitir bloqueo por cobranza" (feedback Lucy/Sam 2026-10-26).
 *
 * Bandera por colegio que prende/apaga el superadmin. Cuando es `true`, la cuenta NO se bloquea
 * por el gate "a fuerza con tarjeta" (You/You+ Stripe sin suscripción activa: NONE o CANCELED
 * vencida) aunque no tenga suscripción activa. Escape hatch para clientes que están regularizando
 * su tarjeta (p.ej. Kommati) sin tener que tocar Stripe.
 *
 * Alcance acotado (decisión 2026-10-26): SOLO salta `schoolNeedsCard`. NO afecta el cobro (Stripe
 * sigue intentando cobrar) ni la suspensión por cobro fallido real (SUSPENDED sigue bloqueando).
 *
 * DEFAULT false → todos los colegios existentes conservan el comportamiento actual.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.boolean('bSkipBillingBlock').notNullable().defaultTo(false);
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.dropColumn('bSkipBillingBlock');
    });
}
