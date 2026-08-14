/**
 * Webhook signature verification, dunning, suspension and idempotency.
 *
 * Payloads are signed with Stripe's own `webhooks.generateTestHeaderString`, so the real verification
 * path in `stripe.webhooks.constructEvent` is exercised — not a stub. What this does NOT cover is
 * Stripe's servers reaching the deployed URL, which is dashboard configuration rather than code.
 */
import {
    section, check, setFile, note, skip, request, app, db, BASE, WEBHOOK_PATH,
    pickFixture, mintAuth, snapshotSchool, restoreSchool, setTariff, readSchool,
    deletePaymentsFor, hasStripe, ensureWebhookSecret, nowSeconds
} from './helpers';
import stripe from '../../Services/Stripe.service';

const FAKE_CUSTOMER = 'cus_unittest_p3_webhook';

export default async function run(): Promise<void> {
    setFile('05_webhooks');
    if (!hasStripe()) {
        skip('webhook + dunning flow', 'no test-mode STRIPE_PRIVATE_KEY configured');
        return;
    }
    const sSecret = ensureWebhookSecret();

    const send = async (oEvent: any) => {
        const sPayload = JSON.stringify(oEvent);
        const sSig = (stripe as any).webhooks.generateTestHeaderString({ payload: sPayload, secret: sSecret });
        return await request(app).post(WEBHOOK_PATH)
            .set('stripe-signature', sSig).set('Content-Type', 'application/json').send(sPayload);
    };
    const failedEvent = (i: number) => ({
        id: `evt_unittest_f${i}`, type: 'invoice.payment_failed',
        data: { object: { id: `in_unittest_${i}`, customer: FAKE_CUSTOMER, amount_due: 1170000, currency: 'mxn', created: nowSeconds(), charge: null } }
    });
    const paidEvent = () => ({
        id: 'evt_unittest_paid', type: 'invoice.paid',
        data: { object: { id: 'in_unittest_paid', customer: FAKE_CUSTOMER, amount_paid: 1170000, currency: 'mxn',
            created: nowSeconds(), charge: 'ch_unittest_paid',
            status_transitions: { paid_at: nowSeconds() }, lines: { data: [{ period: { end: nowSeconds() + 2592000 } }] } } }
    });

    const oFix = await pickFixture();
    const oSnap = await snapshotSchool(oFix.sSchoolId);
    const oMain = await mintAuth(oFix.sMainUserId);

    try {
        await setTariff(oFix.sSchoolId, {
            sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200,
            dDiscountPct: 10, iUsersLimit: 10, iStudentsLimit: 40
        });
        // A synthetic customer id so the webhook can resolve this school.
        await db.raw(`update myvillageschema."Schools" set "sStripeCustomerId" = ?, "sBillingStatus" = 'ACTIVE', "iFailedAttempts" = 0 where "sSchoolId" = ?`,
            [FAKE_CUSTOMER, oFix.sSchoolId]);
        await deletePaymentsFor(oFix.sSchoolId);

        section('the endpoint sits outside :sLang and outside auth');
        note(`path: ${WEBHOOK_PATH}`);
        check('NOT reachable under /sp', (await request(app).post(`${BASE}/billing/webhook`).send({})).status, 404);

        section('signature verification');
        const oForged = await request(app).post(WEBHOOK_PATH)
            .set('stripe-signature', 't=1,v1=deadbeef').set('Content-Type', 'application/json').send('{"type":"invoice.paid"}');
        check('a FORGED signature is rejected -> 400', oForged.status, 400);
        note(`message: ${oForged.body?.message}`);
        const oNoSig = await request(app).post(WEBHOOK_PATH).set('Content-Type', 'application/json').send('{"type":"invoice.paid"}');
        check('a MISSING signature is rejected -> 400', oNoSig.status, 400);
        check('an unhandled event type is acknowledged -> 200', (await send({ id: 'evt_x', type: 'customer.created', data: { object: {} } })).status, 200);

        section('dunning — initial attempt plus two retries, then suspend');
        for (const i of [1, 2, 3]) {
            const oRes = await send(failedEvent(i));
            const oRow = await readSchool(oFix.sSchoolId);
            check(`failure ${i} accepted -> 200`, oRes.status, 200);
            check(`  counter is ${i}`, Number(oRow.iFailedAttempts), i);
            check(`  status`, oRow.sBillingStatus, i < 3 ? 'PAST_DUE' : 'SUSPENDED');
            if (i < 3) {
                check('  PAST_DUE still has access', (await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 })).status, 201);
            }
        }
        check('SUSPENDED blocks the school -> 402', (await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 })).status, 402);
        check('support tickets still work while suspended', (await request(app).post(`${BASE}/support/ticket`).set(oMain).send({ sSubject: 'Suspendido', sMessage: 'Ayuda' })).status, 200);
        const oFails = await db.raw(`select count(*)::int n from myvillageschema."Payments" where "sSchoolId" = ? and "sStatus" = 'failed'`, [oFix.sSchoolId]);
        check('three failed attempts recorded in the history', oFails.rows[0].n, 3);

        section('a successful charge clears delinquency and restores access');
        check('invoice.paid -> 200', (await send(paidEvent())).status, 200);
        const oOk = await readSchool(oFix.sSchoolId);
        check('counter cleared', Number(oOk.iFailedAttempts), 0);
        check('status ACTIVE', oOk.sBillingStatus, 'ACTIVE');
        check('period end advanced', !!oOk.tCurrentPeriodEnd, true);
        check('access restored', (await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 })).status, 201);
        const oSucc = await db.raw(`select count(*)::int n from myvillageschema."Payments" where "sSchoolId" = ? and "sStatus" = 'succeeded'`, [oFix.sSchoolId]);
        check('the charge is in the history', oSucc.rows[0].n, 1);

        section('idempotency — Stripe may deliver the same event more than once');
        await send(paidEvent());
        await send(paidEvent());
        const oSucc2 = await db.raw(`select count(*)::int n from myvillageschema."Payments" where "sSchoolId" = ? and "sStatus" = 'succeeded'`, [oFix.sSchoolId]);
        check('three deliveries, still ONE row', oSucc2.rows[0].n, 1);

        section('customer.subscription.updated mirrors Stripe onto the school');
        const subEvent = (sStatus: string, bCancel: boolean, sType = 'customer.subscription.updated') => ({
            id: `evt_sub_${sStatus}`, type: sType,
            data: { object: { id: 'sub_unittest', customer: FAKE_CUSTOMER, status: sStatus, cancel_at_period_end: bCancel, current_period_end: nowSeconds() + 1000 } }
        });
        for (const [sStripe, bCancel, sExpected] of [
            ['past_due', false, 'PAST_DUE'], ['unpaid', false, 'SUSPENDED'],
            ['active', false, 'ACTIVE'], ['active', true, 'CANCELED'], ['trialing', false, 'TRIALING']
        ] as any[]) {
            await send(subEvent(sStripe, bCancel));
            const oRow = await readSchool(oFix.sSchoolId);
            check(`${sStripe}${bCancel ? ' + cancel' : ''} -> ${sExpected}`, oRow.sBillingStatus, sExpected);
        }

        section('customer.subscription.deleted');
        await db.raw(`update myvillageschema."Schools" set "sStripeSubscriptionId" = 'sub_unittest' where "sSchoolId" = ?`, [oFix.sSchoolId]);
        check('-> 200', (await send(subEvent('canceled', false, 'customer.subscription.deleted'))).status, 200);
        const oDel = await readSchool(oFix.sSchoolId);
        check('status CANCELED', oDel.sBillingStatus, 'CANCELED');
        check('subscription id cleared', oDel.sStripeSubscriptionId, null);

        section('an unknown customer is logged, never crashed on');
        const oUnknown = await send({
            id: 'evt_unknown', type: 'invoice.paid',
            data: { object: { id: 'in_unknown', customer: 'cus_does_not_exist_at_all', amount_paid: 100, currency: 'mxn',
                created: nowSeconds(), charge: 'ch_unknown', status_transitions: { paid_at: nowSeconds() }, lines: { data: [] } } }
        });
        check('still answers 200 (a non-2xx would make Stripe retry for days)', oUnknown.status, 200);
    } finally {
        await deletePaymentsFor(oFix.sSchoolId);
        await restoreSchool(oFix.sSchoolId, oSnap);
    }
}
