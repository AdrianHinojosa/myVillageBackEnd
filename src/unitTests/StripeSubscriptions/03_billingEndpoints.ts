/**
 * The billing endpoints that need no Stripe call, plus the permission rules.
 *
 * Also asserts that the Stripe-dependent routes fail with a clean, localized 503 when no key is
 * configured, rather than letting the SDK throw an unhandled error.
 */
import {
    section, check, setFile, note, skip, request, app, db, BASE,
    pickFixture, mintAuth, snapshotSchool, restoreSchool, setTariff, deletePaymentsFor, hasStripe
} from './helpers';
import BillingQueries from '../../Api/030_Billing/billing.queries';

export default async function run(): Promise<void> {
    setFile('03_billingEndpoints');
    const oFix = await pickFixture();
    const oSnap = await snapshotSchool(oFix.sSchoolId);
    const oMain = await mintAuth(oFix.sMainUserId);

    try {
        await setTariff(oFix.sSchoolId, {
            sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200,
            dDiscountPct: 10, iUsersLimit: 10, iStudentsLimit: 40
        });

        section('GET /billing/summary — the official amount, no Stripe call needed');
        const oSum = await request(app).get(`${BASE}/billing/summary`).set(oMain);
        check('-> 200', oSum.status, 200);
        const oR = oSum.body?.results;
        check('envelope is `results` (what the frontend reads)', !!oR, true);
        check('dMonthlyTotal 500x10 + 200x40 - 10%', oR?.dMonthlyTotal, 11700);
        check('iTeachersLimit mapped from iUsersLimit', oR?.iTeachersLimit, 10);
        check('iStudentsLimit', oR?.iStudentsLimit, 40);
        check('sCurrency MXN', oR?.sCurrency, 'MXN');
        check('sBillingStatus', oR?.sBillingStatus, 'NONE');
        check('bCancelAtPeriodEnd', oR?.bCancelAtPeriodEnd, false);
        const aKeys = ['sBillingMode', 'dFixedAmount', 'dAmountPerTeacher', 'dAmountPerStudent',
            'dDiscountPct', 'sBillingStatus', 'sCurrency', 'dMonthlyTotal', 'tCurrentPeriodEnd',
            'bCancelAtPeriodEnd', 'iTeachersLimit', 'iStudentsLimit'];
        check('every IBillingSummary key present', aKeys.every(k => k in (oR || {})), true);

        section('unauthenticated access is refused');
        check('no token -> 401', (await request(app).get(`${BASE}/billing/summary`)).status, 401);

        section('GET /billing/payments — history from our own table');
        await deletePaymentsFor(oFix.sSchoolId);
        await db.raw(`insert into myvillageschema."Payments"
            ("sSchoolId","dAmount","sCurrency","tPaidAt","sStatus","sCardBrand","sLast4","sStripeTransactionId")
            values (?, 11700, 'MXN', NOW(), 'succeeded', 'visa', '4242', 'ch_unittest_p3')`, [oFix.sSchoolId]);
        const oPay = await request(app).get(`${BASE}/billing/payments`).set(oMain);
        check('-> 200', oPay.status, 200);
        check('envelope is `aData`', Array.isArray(oPay.body?.aData), true);
        const oRow = (oPay.body?.aData || []).find((x: any) => x.sStripeTransactionId === 'ch_unittest_p3');
        check('the payment is returned', !!oRow, true);
        check('dAmount is numeric, not a string', oRow?.dAmount, 11700);
        check('sStatus is lowercase (frontend IPayment)', oRow?.sStatus, 'succeeded');
        const aPayKeys = ['sPaymentId', 'dAmount', 'sCurrency', 'tPaidAt', 'sStatus', 'sCardBrand', 'sLast4', 'sStripeTransactionId'];
        check('every IPayment key present', aPayKeys.every(k => k in (oRow || {})), true);

        section('payments are idempotent — Stripe may redeliver an event');
        await BillingQueries.recordPayment({
            sSchoolId: oFix.sSchoolId, dAmount: 11700, sCurrency: 'MXN', tPaidAt: new Date().toISOString(),
            sStatus: 'succeeded', sCardBrand: 'visa', sLast4: '4242', sStripeTransactionId: 'ch_unittest_p3'
        });
        const oCount = await db.raw(`select count(*)::int n from myvillageschema."Payments" where "sStripeTransactionId" = 'ch_unittest_p3'`);
        check('recording the same charge twice leaves ONE row', oCount.rows[0].n, 1);

        section('the main-user rule (contract: solo el usuario principal)');
        check('main user IS main', await BillingQueries.isMainSchoolUser(oFix.sSchoolId, oFix.sMainUserId), true);
        if (oFix.sOtherUserId) {
            check('another school user is NOT main', await BillingQueries.isMainSchoolUser(oFix.sSchoolId, oFix.sOtherUserId), false);
        } else {
            skip('another school user is NOT main', 'this school has only one user');
        }

        section('payment-method id is validated before reaching the Stripe SDK');
        const oBad = await request(app).post(`${BASE}/billing/payment-methods`).set(oMain)
            .send({ sPaymentMethodId: 'not-a-pm-id' });
        check('malformed id -> 409', oBad.status, 409);
        check('  and not a 500', oBad.status !== 500, true);
        note(`message: ${oBad.body?.message}`);

        section('Stripe-dependent routes when no key is configured');
        if (hasStripe()) {
            skip('503 without a key', 'a real test key IS configured — covered in 04_cards');
        } else {
            for (const [sMethod, sPath] of [['post', '/billing/setup-intent'], ['get', '/billing/payment-methods'], ['post', '/billing/cancel']]) {
                const oRes = await (request(app) as any)[sMethod](`${BASE}${sPath}`).set(oMain).send({});
                check(`${sMethod.toUpperCase()} ${sPath} -> 503, not a crash`, oRes.status, 503);
            }
        }
    } finally {
        await deletePaymentsFor(oFix.sSchoolId);
        await restoreSchool(oFix.sSchoolId, oSnap);
    }
}
