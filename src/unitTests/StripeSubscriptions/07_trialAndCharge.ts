/**
 * The full monthly lifecycle, using a Stripe TEST CLOCK to fast-forward time on Stripe's servers.
 *
 * This is the only way to prove that a real charge actually happens when the 30-day trial ends —
 * without it, the trial would simply not have expired yet and the first renewal would be unverified.
 *
 * Runs against Stripe only (no app endpoints), because a test clock needs its own customer that is
 * bound to the clock at creation time.
 *
 * SLOW: advancing a clock takes Stripe a little while to settle, so this file polls.
 */
import { section, check, setFile, note, skip, hasStripe, trackClock, waitFor, nowSeconds } from './helpers';
import stripe from '../../Services/Stripe.service';
import { toStripeAmount, fromStripeAmount, mapStripeStatus, fromStripeTimestamp, TRIAL_PERIOD_DAYS } from '../../Services/Stripe.service';

export default async function run(): Promise<void> {
    setFile('07_trialAndCharge');
    if (!hasStripe()) {
        skip('trial-end charge via test clock', 'no test-mode STRIPE_PRIVATE_KEY configured');
        return;
    }
    if (!(stripe as any).testHelpers?.testClocks) {
        skip('trial-end charge via test clock', 'this Stripe SDK has no test-clock support');
        return;
    }

    let sClock = '', sCustomer = '', sSub = '';
    try {
        section('a customer bound to a test clock, with a card');
        const iStart = nowSeconds();
        const oClock: any = await (stripe as any).testHelpers.testClocks.create({
            frozen_time: iStart, name: 'MyVillage P3 trial-end test'
        });
        sClock = oClock.id; trackClock(sClock);
        const oCustomer: any = await stripe.customers.create({ name: 'ClockTest School', test_clock: sClock } as any);
        sCustomer = oCustomer.id;
        await stripe.paymentMethods.attach('pm_card_visa', { customer: sCustomer }).catch(() => {});
        const oPms: any = await stripe.paymentMethods.list({ customer: sCustomer, type: 'card' });
        check('the card is attached', oPms.data.length, 1);
        const sPm = oPms.data[0].id;
        await stripe.customers.update(sCustomer, { invoice_settings: { default_payment_method: sPm } });

        section('subscription with our real 30-day trial');
        const oPrice: any = await stripe.prices.create({
            currency: 'mxn', unit_amount: toStripeAmount(11700),
            recurring: { interval: 'month' }, product_data: { name: 'My Village — ClockTest' }
        });
        const oSub: any = await stripe.subscriptions.create({
            customer: sCustomer, items: [{ price: oPrice.id }],
            trial_period_days: TRIAL_PERIOD_DAYS, default_payment_method: sPm
        });
        sSub = oSub.id;
        check('Stripe says trialing', oSub.status, 'trialing');
        check('we map that to TRIALING', mapStripeStatus(oSub.status, oSub.cancel_at_period_end), 'TRIALING');
        check(`trial is ${TRIAL_PERIOD_DAYS} days`, Math.round((oSub.trial_end - oSub.trial_start) / 86400), TRIAL_PERIOD_DAYS);

        const oInvoicesBefore: any = await stripe.invoices.list({ customer: sCustomer, limit: 10 });
        check('NOTHING is charged during the trial', oInvoicesBefore.data.filter((i: any) => i.amount_paid > 0).length, 0);

        section('advance the clock 31 days, past the trial');
        await (stripe as any).testHelpers.testClocks.advance(sClock, { frozen_time: iStart + (31 * 86400) });
        const bReady = await waitFor(async () => {
            const oCl: any = await (stripe as any).testHelpers.testClocks.retrieve(sClock);
            return oCl.status === 'ready';
        });
        check('the clock settled', bReady, true);
        if (!bReady) { note('Stripe did not settle the clock in time; the assertions below may be premature'); }

        const oSubAfter: any = await stripe.subscriptions.retrieve(sSub);
        check('subscription is now active', oSubAfter.status, 'active');
        check('we map that to ACTIVE', mapStripeStatus(oSubAfter.status, oSubAfter.cancel_at_period_end), 'ACTIVE');

        section('a REAL charge happened when the trial ended');
        const oInvoices: any = await stripe.invoices.list({ customer: sCustomer, limit: 10 });
        const aPaid = oInvoices.data.filter((i: any) => i.amount_paid > 0);
        check('exactly one paid invoice', aPaid.length, 1);
        check('charged 1170000 centavos (= $11,700 MXN)', aPaid[0]?.amount_paid, 1170000);
        check('currency mxn', aPaid[0]?.currency, 'mxn');
        check('it has a charge id for the payment history', !!aPaid[0]?.charge, true);
        note(`invoice ${aPaid[0]?.id} status=${aPaid[0]?.status}`);

        section('our conversions handle the real values');
        check('fromStripeAmount -> 11700', fromStripeAmount(aPaid[0].amount_paid), 11700);
        check('the new period end parses', typeof fromStripeTimestamp(oSubAfter.current_period_end), 'string');
    } finally {
        try { if (sSub) await stripe.subscriptions.del(sSub); } catch {}
        try { if (sCustomer) await stripe.customers.del(sCustomer); } catch {}
        // The clock is removed by releaseStripe() in the runner.
    }
}
