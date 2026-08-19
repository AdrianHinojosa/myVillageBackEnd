import * as Knex from "knex";

/**
 * Punto 3 — Módulo de cobranza automática (Stripe).
 *
 * Billing configuration and subscription state, per school. A therapist account is a Schools row
 * too, so it bills through exactly this same path (PO decision 2026-08-07).
 *
 * IMPORTANT DEFAULT: `sBillingStatus` starts at 'NONE', and only 'SUSPENDED' ever blocks access.
 * Every school that exists today therefore stays completely outside billing — no charges, no
 * suspension, full access — until a superadmin explicitly configures a tariff for it
 * (PO decision 2026-08-07).
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Schools', (table: any) => {
        // ---- Tariff configuration (set by the superadmin) ----
        // 'FIXED'    -> dFixedAmount is charged monthly
        // 'VARIABLE' -> dAmountPerTeacher * iUsersLimit + dAmountPerStudent * iStudentsLimit
        table.string('sBillingMode').notNullable().defaultTo('FIXED');
        table.decimal('dFixedAmount', 12, 2).nullable();
        table.decimal('dAmountPerTeacher', 12, 2).nullable();
        table.decimal('dAmountPerStudent', 12, 2).nullable();
        // Optional discount applied to the subtotal, 0-100.
        table.decimal('dDiscountPct', 5, 2).nullable();

        // ---- Subscription state (mirrors Stripe) ----
        // NONE | TRIALING | ACTIVE | PAST_DUE | SUSPENDED | CANCELED
        table.string('sBillingStatus').notNullable().defaultTo('NONE');
        table.string('sStripeCustomerId').nullable();
        table.string('sStripeSubscriptionId').nullable();
        // The Price currently attached to the subscription. Tracked so a tariff change can create a
        // new Price and swap it without proration, i.e. from the next cycle only.
        table.string('sStripePriceId').nullable();
        // Cut-off date of the period already paid for. A cancellation stays active until this date.
        table.timestamp('tCurrentPeriodEnd').nullable();
        table.boolean('bCancelAtPeriodEnd').notNullable().defaultTo(false);
        // Consecutive failed charge attempts. The contract allows the initial attempt plus two
        // retries, so reaching 3 means suspension. Counted here rather than relying on Stripe's
        // dashboard-configured retry schedule, so the rule holds whatever that is set to.
        table.integer('iFailedAttempts').notNullable().defaultTo(0);
    })
    .then(() => {
        // Webhooks arrive keyed by Stripe ids, so those lookups must not table-scan.
        return Knex.schema.raw('CREATE INDEX "Schools_sStripeCustomerId_idx" ON "Schools" ("sStripeCustomerId")');
    })
    .then(() => {
        return Knex.schema.raw('CREATE INDEX "Schools_sStripeSubscriptionId_idx" ON "Schools" ("sStripeSubscriptionId")');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.raw('DROP INDEX IF EXISTS "Schools_sStripeCustomerId_idx"')
        .then(() => Knex.schema.raw('DROP INDEX IF EXISTS "Schools_sStripeSubscriptionId_idx"'))
        .then(() => {
            return Knex.schema.alterTable('Schools', (table: any) => {
                table.dropColumn('sBillingMode');
                table.dropColumn('dFixedAmount');
                table.dropColumn('dAmountPerTeacher');
                table.dropColumn('dAmountPerStudent');
                table.dropColumn('dDiscountPct');
                table.dropColumn('sBillingStatus');
                table.dropColumn('sStripeCustomerId');
                table.dropColumn('sStripeSubscriptionId');
                table.dropColumn('sStripePriceId');
                table.dropColumn('tCurrentPeriodEnd');
                table.dropColumn('bCancelAtPeriodEnd');
                table.dropColumn('iFailedAttempts');
            });
        });
}
