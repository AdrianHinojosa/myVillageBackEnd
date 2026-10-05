import * as Knex from "knex";

/**
 * Feature — Pago por transferencia (billing manual).
 *
 * Un colegio en modo TRANSFER se cobra manualmente: el superadmin captura el monto mensual
 * y la fecha de vencimiento, y registra cada pago recibido (que avanza el ciclo +1 mes).
 * En modo TRANSFER se ignora Stripe por completo (sin subscription, sin webhooks, sin dunning,
 * sin suspensión automática).
 *
 * DEFAULT: `sPaymentMethod` = 'TRANSFER' → todos los colegios existentes quedan en modo
 * transferencia automáticamente al correr esta migración (decisión PO 2026-08-21).
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        // 'STRIPE'   -> cobro automático con tarjeta (Stripe)
        // 'TRANSFER' -> cobro manual por transferencia
        table.string('sPaymentMethod').notNullable().defaultTo('TRANSFER');
        // Monto mensual para colegios en transferencia (capturado por el superadmin).
        table.decimal('dMonthlyAmount', 12, 2).nullable();
        // Próxima fecha de vencimiento del ciclo mensual. Avanza +1 mes por cada pago registrado.
        table.date('tNextPaymentDate').nullable();
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        table.dropColumn('sPaymentMethod');
        table.dropColumn('dMonthlyAmount');
        table.dropColumn('tNextPaymentDate');
    });
}
