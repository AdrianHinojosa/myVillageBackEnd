import * as Knex from "knex";

/**
 * Punto 3 — historial de pagos.
 *
 * One row per charge attempt, so the school can see amount, date, method and the Stripe transaction
 * id, exactly as the contract requires ("una vista de historial donde se podrán consultar los pagos
 * realizados, su monto, fecha y método de pago utilizado e identificador de transacción de Stripe").
 *
 * Rows are written by the Stripe webhooks, never by a user. `sStripeTransactionId` is UNIQUE
 * because Stripe explicitly may deliver the same event more than once — without that constraint a
 * redelivery would duplicate a payment in the school's history.
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Payments', (table: any) => {
            table.uuid('sPaymentId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sSchoolId').references('sSchoolId').inTable('Schools').notNullable();

            table.decimal('dAmount', 12, 2).notNullable().defaultTo(0);
            table.string('sCurrency').notNullable().defaultTo('MXN');
            table.timestamp('tPaidAt').nullable();

            // Lowercase on purpose: the frontend's IPayment types this as
            // 'succeeded' | 'failed' | 'pending', which are also Stripe's own values.
            table.string('sStatus').notNullable().defaultTo('pending');

            // Card used, denormalised at charge time so the history stays truthful even if the
            // school later deletes that card.
            table.string('sCardBrand').defaultTo('');
            table.string('sLast4').defaultTo('');

            // Stripe identifiers. The transaction id is what the contract asks be visible.
            table.string('sStripeTransactionId').unique().nullable();
            table.string('sStripeInvoiceId').nullable();

            table.timestamps(true, true);
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Payments_sSchoolId_idx" ON "Payments" ("sSchoolId")');
        })
        .then(() => {
            return Knex.schema.raw('CREATE INDEX "Payments_tPaidAt_idx" ON "Payments" ("tPaidAt")');
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Payments');
}
