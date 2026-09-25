/**
 * Pure logic — no database, no Stripe, no network.
 *
 * These guard the single most consequential piece of P3: the amount actually charged. The formula is
 * a deliberate mirror of the frontend's `computeMonthlyTotal()` in app/utils/billing.ts, because the
 * frontend previews the figure and the backend charges it. If they ever diverge, a school is billed
 * something other than what it was shown.
 */
import { section, check, setFile } from './helpers';
import {
    toStripeAmount, fromStripeAmount, applyDiscount, computeMonthlyTotal, computeQuotaTotal,
    hasChargeableTariff, mapStripeStatus, fromStripeTimestamp,
    BILLING_CURRENCY, TRIAL_PERIOD_DAYS, MAX_FAILED_ATTEMPTS
} from '../../Services/Stripe.service';

export default async function run(): Promise<void> {
    setFile('01_money');

    section('constants match the contract');
    check('currency is MXN', BILLING_CURRENCY, 'MXN');
    check('trial is 30 days (PO decision)', TRIAL_PERIOD_DAYS, 30);
    check('max attempts is 3 (initial + 2 retries)', MAX_FAILED_ATTEMPTS, 3);

    section('peso <-> centavo conversion');
    check('1234.56 -> 123456', toStripeAmount(1234.56), 123456);
    check('round trip', fromStripeAmount(toStripeAmount(1234.56)), 1234.56);
    check('float dust 12.005 -> 1201', toStripeAmount(12.005), 1201);
    check('0 -> 0', toStripeAmount(0), 0);
    check('11700 -> 1170000', toStripeAmount(11700), 1170000);

    section('discount clamped to [0,100]');
    check('10% off 10000', applyDiscount(10000, 10), 9000);
    check('0% leaves it alone', applyDiscount(10000, 0), 10000);
    check('null leaves it alone', applyDiscount(10000, null), 10000);
    check('over 100 clamps to free', applyDiscount(10000, 150), 0);
    check('negative clamps to none', applyDiscount(10000, -50), 10000);
    check('rounds to 2 decimals', applyDiscount(99.99, 33), 66.99);

    section('FIXED modality');
    check('plain amount', computeMonthlyTotal({ sBillingMode: 'FIXED', dFixedAmount: 10000 }), 10000);
    check('with 10% off', computeMonthlyTotal({ sBillingMode: 'FIXED', dFixedAmount: 10000, dDiscountPct: 10 }), 9000);
    check('unconfigured is 0', computeMonthlyTotal({ sBillingMode: 'FIXED' }), 0);

    section('VARIABLE modality — uses the CONFIGURED LIMITS, not real headcount');
    const oVar = {
        sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200,
        iUsersLimit: 10, iStudentsLimit: 40
    };
    check('500x10 + 200x40', computeMonthlyTotal(oVar), 13000);
    check('same with 10% off', computeMonthlyTotal({ ...oVar, dDiscountPct: 10 }), 11700);
    check('raising the teacher limit re-prices', computeMonthlyTotal({ ...oVar, iUsersLimit: 20, dDiscountPct: 10 }), 16200);
    check('zero limits -> 0', computeMonthlyTotal({ ...oVar, iUsersLimit: 0, iStudentsLimit: 0 }), 0);

    section('Punto 18 — You/You+ cobran por CUOTA sobre reales (base incluida + excedente)');
    // You: base 490 incl. 1 usuario / 10 pacientes, +$44/paciente, sin excedente de usuario.
    check('You base (1u/10p)', computeQuotaTotal('YOU', { iActiveUsers: 1, iActiveStudents: 10 }), 490);
    check('You +5 pacientes', computeQuotaTotal('YOU', { iActiveUsers: 1, iActiveStudents: 15 }), 710);
    check('You usuarios extra no cobran', computeQuotaTotal('YOU', { iActiveUsers: 5, iActiveStudents: 10 }), 490);
    // You+: base 640 incl. 4 usuarios / 10 pacientes, +$25/usuario, +$44/paciente.
    check('You+ base (4u/10p)', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 4, iActiveStudents: 10 }), 640);
    check('You+ +2u +2p', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 6, iActiveStudents: 12 }), 778);
    check('You+ con 10% off', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 6, iActiveStudents: 12, dDiscountPct: 10 }), 700.2);
    // computeMonthlyTotal enruta a la cuota solo para You/You+ cobradas por Stripe.
    check('computeMonthlyTotal enruta You (Stripe)', computeMonthlyTotal({ sAccountType: 'YOU', sPaymentMethod: 'STRIPE', iActiveUsers: 1, iActiveStudents: 15 }), 710);
    check('THERAPIST normaliza a You', computeMonthlyTotal({ sAccountType: 'THERAPIST', sPaymentMethod: 'STRIPE', iActiveUsers: 1, iActiveStudents: 15 }), 710);
    // SALVAGUARDA: una cuenta You en TRANSFER NO usa la cuota — conserva su tarifa manual (colegios/terapeutas en vivo).
    check('You en TRANSFER ignora la cuota', computeMonthlyTotal({ sAccountType: 'YOU', sPaymentMethod: 'TRANSFER', sBillingMode: 'FIXED', dFixedAmount: 300, iActiveStudents: 99 }), 300);

    section('chargeability');
    check('a real tariff is chargeable', hasChargeableTariff({ sBillingMode: 'FIXED', dFixedAmount: 100 }), true);
    check('nothing configured is not', hasChargeableTariff({ sBillingMode: 'FIXED' }), false);
    check('100% discount is not', hasChargeableTariff({ sBillingMode: 'FIXED', dFixedAmount: 100, dDiscountPct: 100 }), false);

    section('Stripe status -> our status');
    check('trialing', mapStripeStatus('trialing'), 'TRIALING');
    check('active', mapStripeStatus('active'), 'ACTIVE');
    check('past_due', mapStripeStatus('past_due'), 'PAST_DUE');
    check('unpaid means retries exhausted', mapStripeStatus('unpaid'), 'SUSPENDED');
    check('incomplete_expired likewise', mapStripeStatus('incomplete_expired'), 'SUSPENDED');
    check('canceled', mapStripeStatus('canceled'), 'CANCELED');
    check('active + cancel_at_period_end', mapStripeStatus('active', true), 'CANCELED');
    check('trialing + cancel_at_period_end', mapStripeStatus('trialing', true), 'CANCELED');
    check('unknown falls back to NONE', mapStripeStatus('something_new'), 'NONE');

    section('timestamps');
    check('unix seconds -> ISO', fromStripeTimestamp(0), null);
    check('null stays null', fromStripeTimestamp(null), null);
    check('a real value parses', typeof fromStripeTimestamp(1700000000), 'string');
}
