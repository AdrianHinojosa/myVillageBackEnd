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
    toStripeAmount, fromStripeAmount, applyDiscount, computeMonthlyTotal,
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
