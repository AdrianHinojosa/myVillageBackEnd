/**
 * Card management and subscription creation, against the REAL Stripe sandbox.
 *
 * Stands in for the browser: normally Stripe.js confirms a SetupIntent and hands us a payment-method
 * id. Here a payment method is created server-side from a Stripe test token, which yields the same
 * kind of id — so the endpoints are exercised exactly as the frontend will call them.
 */
import {
    section, check, setFile, note, skip, request, app, BASE,
    pickFixture, mintAuth, snapshotSchool, restoreSchool, setTariff, readSchool,
    deletePaymentsFor, hasStripe, trackCustomer, trackSubscription
} from './helpers';
import stripe from '../../Services/Stripe.service';

export default async function run(): Promise<void> {
    setFile('04_cards');
    if (!hasStripe()) {
        skip('the whole card + subscription flow', 'no test-mode STRIPE_PRIVATE_KEY configured');
        return;
    }

    const oFix = await pickFixture();
    const oSnap = await snapshotSchool(oFix.sSchoolId);
    const oMain = await mintAuth(oFix.sMainUserId);
    const oOther = oFix.sOtherUserId ? await mintAuth(oFix.sOtherUserId) : null;

    try {
        await setTariff(oFix.sSchoolId, {
            sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200,
            dDiscountPct: 10, iUsersLimit: 10, iStudentsLimit: 40
        });

        section('POST /billing/setup-intent creates the Stripe customer lazily');
        const oSi = await request(app).post(`${BASE}/billing/setup-intent`).set(oMain).send({});
        check('-> 200', oSi.status, 200);
        check('client secret returned for Stripe.js', !!oSi.body?.sClientSecret, true);
        const oAfter = await readSchool(oFix.sSchoolId);
        trackCustomer(oAfter.sStripeCustomerId);
        check('customer persisted on the school', String(oAfter.sStripeCustomerId).startsWith('cus_'), true);

        if (oOther) {
            section('only the MAIN user may manage cards');
            const oForbidden = await request(app).post(`${BASE}/billing/setup-intent`).set(oOther).send({});
            check('another school user -> 403', oForbidden.status, 403);
            note(`message: ${oForbidden.body?.message}`);
        } else {
            skip('only the MAIN user may manage cards', 'this school has only one user');
        }

        section('the first card starts the subscription, with the 30-day trial');
        const oPm: any = await stripe.paymentMethods.create({ type: 'card', card: { token: 'tok_visa' } as any });
        const oAttach = await request(app).post(`${BASE}/billing/payment-methods`).set(oMain).send({ sPaymentMethodId: oPm.id });
        check('-> 201', oAttach.status, 201);
        const oSchool2 = await readSchool(oFix.sSchoolId);
        trackSubscription(oSchool2.sStripeSubscriptionId);
        check('subscription created', String(oSchool2.sStripeSubscriptionId).startsWith('sub_'), true);
        check('price recorded', String(oSchool2.sStripePriceId).startsWith('price_'), true);
        check('status is TRIALING', oSchool2.sBillingStatus, 'TRIALING');
        check('tCurrentPeriodEnd set', !!oSchool2.tCurrentPeriodEnd, true);
        check('failure counter starts at 0', Number(oSchool2.iFailedAttempts), 0);

        const oSub: any = await stripe.subscriptions.retrieve(oSchool2.sStripeSubscriptionId);
        check('trial really is 30 days', Math.round((oSub.trial_end - oSub.trial_start) / 86400), 30);
        const oPrice: any = await stripe.prices.retrieve(oSchool2.sStripePriceId);
        check('Stripe price is 1170000 centavos', oPrice.unit_amount, 1170000);
        check('currency mxn', oPrice.currency, 'mxn');
        check('billed monthly', oPrice.recurring?.interval, 'month');

        section('GET /billing/payment-methods');
        const oCards = await request(app).get(`${BASE}/billing/payment-methods`).set(oMain);
        check('-> 200', oCards.status, 200);
        check('envelope is `aData`', Array.isArray(oCards.body?.aData), true);
        check('one card', oCards.body?.aData?.length, 1);
        check('brand visa', oCards.body?.aData?.[0]?.sBrand, 'visa');
        check('last4 4242', oCards.body?.aData?.[0]?.sLast4, '4242');
        check('flagged default', oCards.body?.aData?.[0]?.bDefault, true);
        const aPmKeys = ['sPaymentMethodId', 'sBrand', 'sLast4', 'iExpMonth', 'iExpYear', 'bDefault'];
        check('every IPaymentMethod key present', aPmKeys.every(k => k in (oCards.body?.aData?.[0] || {})), true);
        const sFirstCard = oCards.body.aData[0].sPaymentMethodId;

        section('summary now reflects the live subscription');
        const oSummary = await request(app).get(`${BASE}/billing/summary`).set(oMain);
        check('dMonthlyTotal still 11700', oSummary.body?.results?.dMonthlyTotal, 11700);
        check('status TRIALING', oSummary.body?.results?.sBillingStatus, 'TRIALING');
        check('bTestMode flagged so nobody mistakes it for live', oSummary.body?.results?.bTestMode, true);

        section('a second card, and switching the default');
        const oPm2: any = await stripe.paymentMethods.create({ type: 'card', card: { token: 'tok_mastercard' } as any });
        check('attach -> 201', (await request(app).post(`${BASE}/billing/payment-methods`).set(oMain).send({ sPaymentMethodId: oPm2.id })).status, 201);
        const oCards2 = await request(app).get(`${BASE}/billing/payment-methods`).set(oMain);
        check('two cards listed', oCards2.body?.aData?.length, 2);
        const oMc = (oCards2.body.aData).find((c: any) => c.sBrand === 'mastercard');
        check('the new card is not default yet', oMc?.bDefault, false);
        check('set default -> 200', (await request(app).put(`${BASE}/billing/payment-methods/${oMc.sPaymentMethodId}/default`).set(oMain)).status, 200);
        const oCards3 = await request(app).get(`${BASE}/billing/payment-methods`).set(oMain);
        check('it is default now', (oCards3.body.aData).find((c: any) => c.sBrand === 'mastercard')?.bDefault, true);
        const oSubAfter: any = await stripe.subscriptions.retrieve(oSchool2.sStripeSubscriptionId);
        check('the SUBSCRIPTION default switched too, so renewals use it', oSubAfter.default_payment_method, oMc.sPaymentMethodId);

        section('detach rules');
        check('a non-default card can be removed', (await request(app).delete(`${BASE}/billing/payment-methods/${sFirstCard}`).set(oMain)).status, 200);
        const oRemaining = (await request(app).get(`${BASE}/billing/payment-methods`).set(oMain)).body.aData;
        check('one card remains', oRemaining.length, 1);
        const oLastDel = await request(app).delete(`${BASE}/billing/payment-methods/${oRemaining[0].sPaymentMethodId}`).set(oMain);
        check('removing the LAST card is refused -> 409', oLastDel.status, 409);
        note('otherwise the next renewal would fail and suspend the school');
        note(`message: ${oLastDel.body?.message}`);
        check("another customer's card -> 404", (await request(app).delete(`${BASE}/billing/payment-methods/pm_card_amex`).set(oMain)).status, 404);

        section('POST /billing/cancel — active until the cut-off, never a refund');
        check('-> 200', (await request(app).post(`${BASE}/billing/cancel`).set(oMain).send({})).status, 200);
        const oSubCancel: any = await stripe.subscriptions.retrieve(oSchool2.sStripeSubscriptionId);
        check('Stripe cancel_at_period_end set', oSubCancel.cancel_at_period_end, true);
        check('NOT cancelled outright', oSubCancel.status !== 'canceled', true);
        const oSchool3 = await readSchool(oFix.sSchoolId);
        check('our status CANCELED', oSchool3.sBillingStatus, 'CANCELED');
        check('bCancelAtPeriodEnd true', oSchool3.bCancelAtPeriodEnd, true);
        check('and the school still has access', (await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 })).status, 201);
    } finally {
        await deletePaymentsFor(oFix.sSchoolId);
        await restoreSchool(oFix.sSchoolId, oSnap);
    }
}
