/**
 * A tariff change must reach Stripe, and must NOT re-price the period already invoiced.
 *
 * Contract: "Los cambios surtirán efecto a partir del siguiente ciclo de cobro, sin afectar el monto
 * del ciclo en curso ya facturado o pendiente de cobro" and, for the variable modality, "No se
 * contemplan ajustes proporcionales (prorrateo) durante el ciclo en curso".
 *
 * This was a real bug: before it was wired, changing a price left Stripe charging the old amount
 * forever.
 */
import {
    section, check, setFile, note, skip, request, app, BASE,
    pickFixture, mintAuth, snapshotSchool, restoreSchool, setTariff, readSchool,
    deletePaymentsFor, hasStripe, trackCustomer, trackSubscription
} from './helpers';
import stripe from '../../Services/Stripe.service';

export default async function run(): Promise<void> {
    setFile('06_tariffSync');
    if (!hasStripe()) {
        skip('tariff -> Stripe sync', 'no test-mode STRIPE_PRIVATE_KEY configured');
        return;
    }

    const oFix = await pickFixture();
    if (!oFix.sAdminUserId) {
        skip('tariff -> Stripe sync', 'no superadmin account in the development database');
        return;
    }
    const oSnap = await snapshotSchool(oFix.sSchoolId);
    const oMain = await mintAuth(oFix.sMainUserId);
    const oAdmin = await mintAuth(oFix.sAdminUserId);

    try {
        section('start from a live subscription at $10,000 FIXED');
        await setTariff(oFix.sSchoolId, { sBillingMode: 'FIXED', dFixedAmount: 10000, iUsersLimit: 10, iStudentsLimit: 40 });
        await request(app).post(`${BASE}/billing/setup-intent`).set(oMain).send({});
        const oPm: any = await stripe.paymentMethods.create({ type: 'card', card: { token: 'tok_visa' } as any });
        await request(app).post(`${BASE}/billing/payment-methods`).set(oMain).send({ sPaymentMethodId: oPm.id });
        let oSchool = await readSchool(oFix.sSchoolId);
        trackCustomer(oSchool.sStripeCustomerId);
        trackSubscription(oSchool.sStripeSubscriptionId);
        check('subscription live', String(oSchool.sStripeSubscriptionId).startsWith('sub_'), true);
        let oPrice: any = await stripe.prices.retrieve(oSchool.sStripePriceId);
        check('Stripe price is 10000 MXN', oPrice.unit_amount, 1000000);

        section('the superadmin raises it to $15,000');
        const oPut = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
            sName: oSnap.sName, iUsersLimit: 10, iStudentsLimit: 40, sBillingMode: 'FIXED', dFixedAmount: 15000
        });
        check('-> 201', oPut.status, 201);
        check('reported as synced to Stripe', oPut.body?.bStripeSynced, true);
        oSchool = await readSchool(oFix.sSchoolId);
        oPrice = await stripe.prices.retrieve(oSchool.sStripePriceId);
        check('a NEW Stripe price of 15000 exists', oPrice.unit_amount, 1500000);
        const oSub: any = await stripe.subscriptions.retrieve(oSchool.sStripeSubscriptionId);
        check('the subscription item points at it', oSub.items.data[0].price.id, oSchool.sStripePriceId);

        section('no proration — the invoiced period is untouched');
        const oUpcoming: any = await stripe.invoices.retrieveUpcoming({ customer: oSchool.sStripeCustomerId });
        const aProration = (oUpcoming?.lines?.data || []).filter((l: any) => l.proration === true);
        check('zero proration line items', aProration.length, 0);
        check('the new amount is what gets charged next cycle', oUpcoming.total, 1500000);
        note('the current period keeps whatever was already invoiced');

        section('a no-op change must not create a junk Stripe price');
        const oSame = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
            sName: oSnap.sName, iUsersLimit: 10, iStudentsLimit: 40, sBillingMode: 'FIXED', dFixedAmount: 15000
        });
        check('not re-synced', oSame.body?.bStripeSynced, false);
        check('reason is `unchanged`', oSame.body?.sStripeSyncReason, 'unchanged');

        section('changing the LIMITS re-prices under the variable modality');
        await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
            sName: oSnap.sName, iUsersLimit: 10, iStudentsLimit: 40,
            sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200, dDiscountPct: 10
        });
        oSchool = await readSchool(oFix.sSchoolId);
        oPrice = await stripe.prices.retrieve(oSchool.sStripePriceId);
        check('500x10 + 200x40 - 10% = 11700', oPrice.unit_amount, 1170000);
        const oBump = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
            sName: oSnap.sName, iUsersLimit: 20, iStudentsLimit: 40,
            sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200, dDiscountPct: 10
        });
        check('raising iUsersLimit re-syncs', oBump.body?.bStripeSynced, true);
        oSchool = await readSchool(oFix.sSchoolId);
        oPrice = await stripe.prices.retrieve(oSchool.sStripePriceId);
        check('now 500x20 + 200x40 - 10% = 16200', oPrice.unit_amount, 1620000);

        section('a school with no subscription still saves, and says why');
        const oOther = await (await import('../../Config/Db.config')).db.raw(
            `select "sSchoolId","sName","iUsersLimit","iStudentsLimit","sBillingMode","dFixedAmount"
             from myvillageschema."Schools"
             where "sStripeSubscriptionId" is null and "bActive" and "sSchoolId" <> ? limit 1`, [oFix.sSchoolId]);
        if (oOther.rows.length) {
            const o = oOther.rows[0];
            const oRes = await request(app).put(`${BASE}/schools/${o.sSchoolId}`).set(oAdmin).send({
                sName: o.sName, iUsersLimit: o.iUsersLimit || 1, iStudentsLimit: o.iStudentsLimit || 1,
                sBillingMode: 'FIXED', dFixedAmount: 5000
            });
            check('the save succeeds -> 201', oRes.status, 201);
            check('reason is `no-subscription`', oRes.body?.sStripeSyncReason, 'no-subscription');
            note('a Stripe outage must never fail the superadmin\'s save — the DB is the source of truth');
            // put that second school back
            const { db } = await import('../../Config/Db.config');
            await db.raw(`update myvillageschema."Schools" set "sBillingMode" = ?, "dFixedAmount" = ? where "sSchoolId" = ?`,
                [o.sBillingMode, o.dFixedAmount, o.sSchoolId]);
        } else {
            skip('a school with no subscription still saves', 'no second school available');
        }
    } finally {
        await deletePaymentsFor(oFix.sSchoolId);
        await restoreSchool(oFix.sSchoolId, oSnap);
    }
}
