import { Response, Request, NextFunction } from 'express';

import MyError from '../../Middlewares/Error.mw';
import BillingQueries from './billing.queries';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

import stripe, {
    BILLING_CURRENCY,
    TRIAL_PERIOD_DAYS,
    isStripeConfigured,
    isStripeTestMode,
    toStripeAmount,
    computeMonthlyTotal,
    hasChargeableTariff,
    mapStripeStatus,
    fromStripeTimestamp
} from '../../Services/Stripe.service';

/**
 * Punto 3 — Cobranza automática (Stripe).
 *
 * All of these operate on `res.locals.sSchoolId`; a school can only ever see its own billing.
 * Mutating routes additionally require the school's MAIN user (see `requireMainUser`), because the
 * contract says "Únicamente el usuario principal del colegio tendrá acceso para registrar,
 * modificar o eliminar tarjetas."
 */

/** Guard: Stripe must be usable before an endpoint that talks to it. */
function assertStripe(res: Response, next: NextFunction): boolean {
    if (!isStripeConfigured()) {
        next(new MyError(503, ErrorMessages.Billing.stripeNotConfigured[res.locals.sLang]));
        return false;
    }
    return true;
}

/** Guard: only the school's main user may manage cards or cancel. */
async function requireMainUser(res: Response, next: NextFunction): Promise<boolean> {
    const { sLang, sSchoolId, sUserId } = res.locals;
    const bMain = await BillingQueries.isMainSchoolUser(sSchoolId, sUserId);
    if (!bMain) {
        next(new MyError(403, ErrorMessages.Billing.onlyMainUser[sLang]));
        return false;
    }
    return true;
}

/**
 * Ensure the school has a Stripe customer, creating one on first use.
 *
 * Deliberately lazy: a school configured with a tariff but no card yet should not exist in Stripe.
 * The customer is created at the moment it is actually needed — the first SetupIntent.
 */
async function ensureStripeCustomer(oSchool: any): Promise<string> {
    if (oSchool.sStripeCustomerId) return oSchool.sStripeCustomerId;

    const oCustomer = await stripe.customers.create({
        name: oSchool.sName || undefined,
        email: oSchool.sEmail || undefined,
        // Lets us find the school from any Stripe object, and makes the dashboard readable.
        metadata: { sSchoolId: oSchool.sSchoolId }
    });

    await BillingQueries.patchSchoolBilling(oSchool.sSchoolId, { sStripeCustomerId: oCustomer.id });
    return oCustomer.id;
}

/**
 * Create the Price representing this school's current monthly amount.
 *
 * A Price is created per amount rather than reusing a catalogue, because every school can have its
 * own figure. `product_data` makes Stripe create the backing Product implicitly, so there is no
 * separate product to manage or store.
 */
async function createPriceForSchool(oSchool: any, dMonthlyTotal: number): Promise<string> {
    const oPrice = await stripe.prices.create({
        currency: BILLING_CURRENCY.toLowerCase(),
        unit_amount: toStripeAmount(dMonthlyTotal),
        recurring: { interval: 'month' },
        product_data: { name: `My Village — ${oSchool.sName || 'Suscripción'}` },
        metadata: { sSchoolId: oSchool.sSchoolId, sBillingMode: oSchool.sBillingMode || 'FIXED' }
    });
    return oPrice.id;
}

// Columna `date` (pg la entrega como Date a medianoche local) → 'YYYY-MM-DD', sin corrimiento de zona.
function toYMDLocal(dValue: any): string | null {
    if (!dValue) return null;
    const o = new Date(dValue);
    if (Number.isNaN(o.getTime())) return null;
    return `${o.getFullYear()}-${String(o.getMonth() + 1).padStart(2, '0')}-${String(o.getDate()).padStart(2, '0')}`;
}

class Controllers {
    constructor() {};

    /**
     * GET /billing/summary
     *
     * Needs no Stripe call: everything is either stored on the school or derived from its tariff,
     * so it works for a school that has never been billed. Envelope is `results` because
     * pages/admin/billing/index.vue reads `data?.results || data?.oData || data`.
     */
    async getSummary(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));

        return res.status(200).json({
            message: SuccessMessages.Billing.getSummary[sLang],
            results: {
                sBillingMode: oSchool.sBillingMode || 'FIXED',
                dFixedAmount: oSchool.dFixedAmount !== null ? Number(oSchool.dFixedAmount) : null,
                dAmountPerTeacher: oSchool.dAmountPerTeacher !== null ? Number(oSchool.dAmountPerTeacher) : null,
                dAmountPerStudent: oSchool.dAmountPerStudent !== null ? Number(oSchool.dAmountPerStudent) : null,
                dDiscountPct: oSchool.dDiscountPct !== null ? Number(oSchool.dDiscountPct) : null,
                sBillingStatus: oSchool.sBillingStatus || 'NONE',
                // Pago por transferencia (billing manual). En modo TRANSFER el frontend muestra
                // la tarjeta manual (estado/monto/próximo pago) en vez de la UI de Stripe.
                sPaymentMethod: oSchool.sPaymentMethod || 'TRANSFER',
                dMonthlyAmount: oSchool.dMonthlyAmount !== null && oSchool.dMonthlyAmount !== undefined ? Number(oSchool.dMonthlyAmount) : null,
                tNextPaymentDate: toYMDLocal(oSchool.tNextPaymentDate),
                sCurrency: BILLING_CURRENCY,
                // The OFFICIAL amount. The frontend previews the same figure with its own mirror of
                // this formula, but this is the one that gets charged.
                dMonthlyTotal: computeMonthlyTotal(oSchool),
                tCurrentPeriodEnd: oSchool.tCurrentPeriodEnd || null,
                bCancelAtPeriodEnd: oSchool.bCancelAtPeriodEnd === true,
                // Named iTeachersLimit on the wire (the frontend's IBillingSummary) but stored as
                // iUsersLimit — the column predates the billing feature.
                iTeachersLimit: oSchool.iUsersLimit ?? null,
                iStudentsLimit: oSchool.iStudentsLimit ?? null,
                // Surfaced so nobody mistakes a sandbox for production while testing.
                bTestMode: isStripeTestMode()
            },
            success: true
        });
    }

    /**
     * GET /billing/payments — history, straight from our own table.
     * Written by the webhooks, so this needs no Stripe call either.
     */
    async getPayments(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        const { iPageNumber = 1, iItemsPerPage = 50 } = req.query;

        const oPayments = await BillingQueries.findPaymentsBySchool(
            sSchoolId, Number(iPageNumber) || 1, Number(iItemsPerPage) || 50
        );

        return res.status(200).json({
            message: SuccessMessages.Billing.getPayments[sLang],
            aData: (oPayments.results || []).map((o: any) => ({
                sPaymentId: o.sPaymentId,
                dAmount: Number(o.dAmount),
                sCurrency: o.sCurrency,
                tPaidAt: o.tPaidAt,
                sStatus: o.sStatus,
                sCardBrand: o.sCardBrand || '',
                sLast4: o.sLast4 || '',
                sStripeTransactionId: o.sStripeTransactionId || ''
            })),
            iTotal: oPayments.total,
            success: true
        });
    }

    /**
     * POST /billing/setup-intent
     *
     * Returns a client secret the browser uses with `stripe.confirmCardSetup`. The card is entered
     * into Stripe's own iframe and never passes through this server.
     */
    async createSetupIntent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));

        const sCustomerId = await ensureStripeCustomer(oSchool);
        const oIntent = await stripe.setupIntents.create({
            customer: sCustomerId,
            payment_method_types: ['card'],
            metadata: { sSchoolId }
        });

        return res.status(200).json({
            message: SuccessMessages.Billing.setupIntent[sLang],
            sClientSecret: oIntent.client_secret,
            success: true
        });
    }

    /** GET /billing/payment-methods — the school's saved cards, from Stripe. */
    async getPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        if (!assertStripe(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));

        // No customer yet means no cards — not an error.
        if (!oSchool.sStripeCustomerId) {
            return res.status(200).json({
                message: SuccessMessages.Billing.getPaymentMethods[sLang],
                aData: [], iTotal: 0, success: true
            });
        }

        const oCustomer: any = await stripe.customers.retrieve(oSchool.sStripeCustomerId);
        const sDefaultId = oCustomer?.invoice_settings?.default_payment_method || null;

        const oList = await stripe.paymentMethods.list({
            customer: oSchool.sStripeCustomerId,
            type: 'card'
        });

        return res.status(200).json({
            message: SuccessMessages.Billing.getPaymentMethods[sLang],
            aData: (oList.data || []).map((oPm: any) => ({
                sPaymentMethodId: oPm.id,
                sBrand: oPm.card?.brand || '',
                sLast4: oPm.card?.last4 || '',
                iExpMonth: oPm.card?.exp_month || null,
                iExpYear: oPm.card?.exp_year || null,
                bDefault: oPm.id === sDefaultId
            })),
            iTotal: (oList.data || []).length,
            success: true
        });
    }

    /**
     * POST /billing/payment-methods — attach a card the browser just tokenised.
     *
     * The FIRST card is what starts billing: it becomes the default and, if the school has a
     * chargeable tariff, the subscription is created here with its 30-day trial.
     */
    async attachPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        const { sPaymentMethodId } = req.body;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));

        // Pago por transferencia: se ignora Stripe. Un colegio en transferencia no adjunta tarjetas.
        if (oSchool.sPaymentMethod === 'TRANSFER') {
            return next(new MyError(409, ErrorMessages.Schools.stripeNotForTransfer[sLang]));
        }

        const sCustomerId = await ensureStripeCustomer(oSchool);

        // Use the id from the RESPONSE, not the request. Attaching can yield a different id than
        // the one supplied — Stripe's shared test payment methods (pm_card_visa and friends) do
        // exactly that — and referring to the input id afterwards then fails with "the customer
        // does not have a payment method with the ID …".
        const oAttached: any = await stripe.paymentMethods.attach(sPaymentMethodId, { customer: sCustomerId });
        const sAttachedId: string = oAttached?.id || sPaymentMethodId;

        // Is this the school's only card? If so it becomes the default.
        const oList = await stripe.paymentMethods.list({ customer: sCustomerId, type: 'card' });
        const bFirstCard = (oList.data || []).length <= 1;
        if (bFirstCard) {
            await stripe.customers.update(sCustomerId, {
                invoice_settings: { default_payment_method: sAttachedId }
            });
        }

        // Start the subscription once there is a card AND something to charge.
        let oPatch: any = {};
        if (!oSchool.sStripeSubscriptionId && hasChargeableTariff(oSchool)) {
            const dTotal = computeMonthlyTotal(oSchool);
            const sPriceId = await createPriceForSchool(oSchool, dTotal);

            const oSub: any = await stripe.subscriptions.create({
                customer: sCustomerId,
                items: [{ price: sPriceId }],
                default_payment_method: sAttachedId,
                // 30-day free trial — PO instruction 2026-08-07. NOT in the signed scope document.
                trial_period_days: TRIAL_PERIOD_DAYS,
                metadata: { sSchoolId }
            });

            oPatch = {
                sStripeSubscriptionId: oSub.id,
                sStripePriceId: sPriceId,
                sBillingStatus: mapStripeStatus(oSub.status, oSub.cancel_at_period_end),
                tCurrentPeriodEnd: fromStripeTimestamp(oSub.current_period_end),
                bCancelAtPeriodEnd: oSub.cancel_at_period_end === true,
                iFailedAttempts: 0
            };
            await BillingQueries.patchSchoolBilling(sSchoolId, oPatch);
        }

        return res.status(201).json({
            message: SuccessMessages.Billing.attachPaymentMethod[sLang],
            success: true
        });
    }

    /** PUT /billing/payment-methods/:sPaymentMethodId/default */
    async setDefaultPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        const { sPaymentMethodId } = req.params;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool?.sStripeCustomerId) {
            return next(new MyError(404, ErrorMessages.Billing.paymentMethodNotFound[sLang]));
        }

        // The card must belong to THIS school's customer — otherwise one school could point at
        // another's card by id.
        const oPm: any = await stripe.paymentMethods.retrieve(sPaymentMethodId);
        if (oPm?.customer !== oSchool.sStripeCustomerId) {
            return next(new MyError(404, ErrorMessages.Billing.paymentMethodNotFound[sLang]));
        }

        await stripe.customers.update(oSchool.sStripeCustomerId, {
            invoice_settings: { default_payment_method: sPaymentMethodId }
        });
        // Keep the subscription in step, or the next renewal would still use the old card.
        if (oSchool.sStripeSubscriptionId) {
            await stripe.subscriptions.update(oSchool.sStripeSubscriptionId, {
                default_payment_method: sPaymentMethodId
            });
        }

        return res.status(200).json({
            message: SuccessMessages.Billing.setDefaultPaymentMethod[sLang],
            success: true
        });
    }

    /** DELETE /billing/payment-methods/:sPaymentMethodId */
    async detachPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        const { sPaymentMethodId } = req.params;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool?.sStripeCustomerId) {
            return next(new MyError(404, ErrorMessages.Billing.paymentMethodNotFound[sLang]));
        }

        const oPm: any = await stripe.paymentMethods.retrieve(sPaymentMethodId);
        if (oPm?.customer !== oSchool.sStripeCustomerId) {
            return next(new MyError(404, ErrorMessages.Billing.paymentMethodNotFound[sLang]));
        }

        // Refuse to remove the last card of an ACTIVE subscription: it would guarantee the next
        // renewal fails, which then suspends the school. Cancelling is the intended route out.
        const oList = await stripe.paymentMethods.list({ customer: oSchool.sStripeCustomerId, type: 'card' });
        const bIsLast = (oList.data || []).length <= 1;
        const bSubActive = !!oSchool.sStripeSubscriptionId
            && ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(oSchool.sBillingStatus || '');
        if (bIsLast && bSubActive) {
            return next(new MyError(409, ErrorMessages.Billing.cannotRemoveLastCard[sLang]));
        }

        await stripe.paymentMethods.detach(sPaymentMethodId);

        // If the default was removed, promote whatever remains so renewals keep working.
        const oRemaining = await stripe.paymentMethods.list({ customer: oSchool.sStripeCustomerId, type: 'card' });
        if ((oRemaining.data || []).length > 0) {
            const oCustomer: any = await stripe.customers.retrieve(oSchool.sStripeCustomerId);
            if (!oCustomer?.invoice_settings?.default_payment_method) {
                const sNextId = oRemaining.data[0].id;
                await stripe.customers.update(oSchool.sStripeCustomerId, {
                    invoice_settings: { default_payment_method: sNextId }
                });
                if (oSchool.sStripeSubscriptionId) {
                    await stripe.subscriptions.update(oSchool.sStripeSubscriptionId, {
                        default_payment_method: sNextId
                    });
                }
            }
        }

        return res.status(200).json({
            message: SuccessMessages.Billing.detachPaymentMethod[sLang],
            success: true
        });
    }

    /**
     * POST /billing/cancel
     *
     * Contract: "Al solicitar, la cuenta se mantendrá activa hasta la fecha de corte del periodo
     * vigente, y a partir de ese momento se suspenderán los cobros recurrentes. No se aplicarán
     * reembolsos parciales por el tiempo no consumido del periodo en curso."
     *
     * So: cancel at period end, never immediately, and never refund.
     */
    async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        if (!oSchool.sStripeSubscriptionId) {
            return next(new MyError(409, ErrorMessages.Billing.noSubscription[sLang]));
        }

        const oSub: any = await stripe.subscriptions.update(oSchool.sStripeSubscriptionId, {
            cancel_at_period_end: true
        });

        await BillingQueries.patchSchoolBilling(sSchoolId, {
            bCancelAtPeriodEnd: true,
            sBillingStatus: 'CANCELED',
            tCurrentPeriodEnd: fromStripeTimestamp(oSub.current_period_end)
        });

        return res.status(200).json({
            message: SuccessMessages.Billing.cancelSubscription[sLang],
            success: true
        });
    }
}

export default new Controllers();
export { createPriceForSchool, ensureStripeCustomer };

/**
 * Push a changed tariff onto the school's live Stripe subscription.
 *
 * The contract is specific about timing: "Los cambios surtirán efecto a partir del siguiente ciclo
 * de cobro, sin afectar el monto del ciclo en curso ya facturado o pendiente de cobro" — and for
 * the variable modality, "No se contemplan ajustes proporcionales (prorrateo) durante el ciclo en
 * curso". Hence `proration_behavior: 'none'`: the current period is left exactly as invoiced and
 * the new amount applies from the next renewal.
 *
 * Best-effort by design. The database is the source of truth for the tariff, so a Stripe outage
 * must not fail the superadmin's save; it is logged and can be re-synced. Returns what happened so
 * the caller can surface it.
 */
export async function syncSubscriptionTariff(oSchool: any): Promise<{ bSynced: boolean, sReason?: string }> {
    // Pago por transferencia: se ignora Stripe por completo (cobro manual). Sin este early-return,
    // cada edición de un colegio en transferencia intentaría tocar Stripe.
    if (oSchool?.sPaymentMethod === 'TRANSFER') return { bSynced: false, sReason: 'transfer' };
    if (!isStripeConfigured()) return { bSynced: false, sReason: 'stripe-not-configured' };
    // Nothing to sync until the school actually has a subscription.
    if (!oSchool?.sStripeSubscriptionId) return { bSynced: false, sReason: 'no-subscription' };

    try {
        const dTotal = computeMonthlyTotal(oSchool);
        if (dTotal <= 0) return { bSynced: false, sReason: 'no-chargeable-tariff' };

        // Skip the round trip when the amount has not actually moved.
        if (oSchool.sStripePriceId) {
            const oCurrent: any = await stripe.prices.retrieve(oSchool.sStripePriceId);
            if (oCurrent?.unit_amount === toStripeAmount(dTotal)) {
                return { bSynced: false, sReason: 'unchanged' };
            }
        }

        const sNewPriceId = await createPriceForSchool(oSchool, dTotal);
        const oSub: any = await stripe.subscriptions.retrieve(oSchool.sStripeSubscriptionId);
        const sItemId = oSub?.items?.data?.[0]?.id;
        if (!sItemId) return { bSynced: false, sReason: 'no-subscription-item' };

        await stripe.subscriptions.update(oSchool.sStripeSubscriptionId, {
            items: [{ id: sItemId, price: sNewPriceId }],
            // The whole point: never re-price the period already invoiced.
            proration_behavior: 'none'
        });

        await BillingQueries.patchSchoolBilling(oSchool.sSchoolId, { sStripePriceId: sNewPriceId });
        return { bSynced: true };
    } catch (error: any) {
        console.error(`syncSubscriptionTariff failed for school ${oSchool.sSchoolId}:`, error?.message);
        return { bSynced: false, sReason: 'stripe-error' };
    }
}
