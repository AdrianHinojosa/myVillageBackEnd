require('dotenv').config();
import Stripe from 'stripe';

/**
 * Punto 3 — Stripe integration.
 *
 * Thin wrapper over the Stripe SDK. Every Stripe call in the codebase goes through here so the
 * API version, the currency and the money conversion live in exactly one place.
 *
 * MONEY: Stripe works in the smallest currency unit. MXN has 2 decimals, so $1,234.56 is 123456.
 * Never pass a float amount to Stripe directly — use `toStripeAmount()`.
 *
 * CARD DATA NEVER REACHES THIS SERVER. The browser confirms a SetupIntent with Stripe.js and sends
 * us only the resulting payment-method id, which keeps the backend out of PCI scope.
 */

export const BILLING_CURRENCY: string = 'MXN';

// Trial length for a new subscription. NOTE: a free trial is NOT in the signed scope document —
// it was added on PO instruction (2026-08-07) as a concession to the client.
export const TRIAL_PERIOD_DAYS: number = 30;

// The contract allows the initial attempt plus two retries.
export const MAX_FAILED_ATTEMPTS: number = 3;

/** Stripe subscription state, mirrored onto Schools.sBillingStatus. */
export type TBillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

const sSecretKey: string = process.env.STRIPE_PRIVATE_KEY || '';

/**
 * Pinned API version. Leaving it unset makes behaviour depend on whatever the Stripe account's
 * dashboard default happens to be, which can change under us without a deploy.
 */
const stripe = new Stripe(sSecretKey, {
    apiVersion: '2022-11-15'
});

export default stripe;

/**
 * True when a REAL, usable secret key is configured.
 *
 * ⚠️ `.env` currently holds the literal placeholders `sk_test` / `pk_test` (7 characters, no key
 * body), which are not credentials. A genuine key is `sk_test_` or `sk_live_` followed by a long
 * random string, so the length check below is what separates a real key from the placeholder.
 * Endpoints call this and return a clean, explanatory error instead of letting the SDK throw.
 */
export function isStripeConfigured(): boolean {
    if (!sSecretKey) return false;
    const bRightShape = sSecretKey.startsWith('sk_test_') || sSecretKey.startsWith('sk_live_');
    return bRightShape && sSecretKey.length > 20;
}

/** True when running against Stripe test mode — surfaced so nobody mistakes it for live. */
export function isStripeTestMode(): boolean {
    return sSecretKey.startsWith('sk_test_');
}

/** True when a LIVE key is in use. Worth logging loudly on boot. */
export function isStripeLiveMode(): boolean {
    return sSecretKey.startsWith('sk_live_');
}

/** Pesos -> centavos, for Stripe. Rounds to avoid float dust (e.g. 12.005 -> 1201). */
export function toStripeAmount(dAmount: number): number {
    return Math.round((Number(dAmount) || 0) * 100);
}

/** Centavos -> pesos, coming back from Stripe. */
export function fromStripeAmount(iAmount: number): number {
    return Math.round((Number(iAmount) || 0)) / 100;
}

/**
 * Apply a discount percentage to a subtotal.
 *
 * Deliberately identical to the frontend's `applyDiscount()` in `app/utils/billing.ts`: clamp the
 * percentage to [0, 100], never return negative, round to 2 decimals. The frontend previews the
 * amount with this formula; the backend's result is the one actually charged, so they must agree.
 */
export function applyDiscount(dSubtotal: number, dDiscountPct: number | null | undefined): number {
    const dBase = Number(dSubtotal) || 0;
    const dPct = Math.min(Math.max(Number(dDiscountPct) || 0, 0), 100);
    const dResult = dBase * (1 - dPct / 100);
    return Math.round((dResult + Number.EPSILON) * 100) / 100;
}

/**
 * The monthly amount to charge a school, with discount applied.
 *
 * VARIABLE uses the CONFIGURED LIMITS (`iUsersLimit`, `iStudentsLimit`), never the real number of
 * registered users. The contract is explicit about why: "El cálculo se realizará siempre con base
 * en el límite configurado, no en el número de usuarios efectivamente registrados durante el
 * periodo, con el fin de evitar manipulaciones del cálculo previo a la fecha de cobro."
 *
 * Mirrors the frontend's `computeMonthlyTotal()`.
 */
export function computeMonthlyTotal(oSchool: any): number {
    if (!oSchool) return 0;

    let dSubtotal = 0;
    if (oSchool.sBillingMode === 'VARIABLE') {
        const dPerTeacher = Number(oSchool.dAmountPerTeacher) || 0;
        const dPerStudent = Number(oSchool.dAmountPerStudent) || 0;
        const iTeachers = Number(oSchool.iUsersLimit) || 0;
        const iStudents = Number(oSchool.iStudentsLimit) || 0;
        dSubtotal = dPerTeacher * iTeachers + dPerStudent * iStudents;
    } else {
        dSubtotal = Number(oSchool.dFixedAmount) || 0;
    }

    return applyDiscount(dSubtotal, oSchool.dDiscountPct);
}

/** True when the school has an amount worth charging. A zero total means nothing to bill. */
export function hasChargeableTariff(oSchool: any): boolean {
    return computeMonthlyTotal(oSchool) > 0;
}

/**
 * Translate a Stripe subscription status into ours.
 *
 * Stripe's `unpaid` and `incomplete_expired` mean the retries are exhausted, which is exactly the
 * contract's "morosa" condition — and that suspends immediately, with no grace period.
 */
export function mapStripeStatus(sStripeStatus: string, bCancelAtPeriodEnd: boolean = false): TBillingStatus {
    switch (sStripeStatus) {
        case 'trialing':
            return bCancelAtPeriodEnd ? 'CANCELED' : 'TRIALING';
        case 'active':
            return bCancelAtPeriodEnd ? 'CANCELED' : 'ACTIVE';
        case 'past_due':
            return 'PAST_DUE';
        case 'unpaid':
        case 'incomplete_expired':
            return 'SUSPENDED';
        case 'canceled':
            return 'CANCELED';
        case 'incomplete':
            return 'PAST_DUE';
        default:
            return 'NONE';
    }
}

/** Unix seconds (what Stripe returns) -> ISO string, or null. */
export function fromStripeTimestamp(iSeconds: number | null | undefined): string | null {
    if (!iSeconds) return null;
    return new Date(Number(iSeconds) * 1000).toISOString();
}
