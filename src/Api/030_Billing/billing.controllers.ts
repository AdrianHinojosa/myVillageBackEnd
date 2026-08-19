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
    fromStripeTimestamp,
    fromStripeAmount
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

    /**
     * POST /billing/pay — "Reintentar pago". Charge the outstanding invoice now.
     *
     * This is how a SUSPENDED school gets back in, and it exists because nothing else does the job:
     * by the time we suspend, Stripe's automatic retries are exhausted, and attaching a new card does
     * NOT make Stripe charge anything. Without this endpoint a school could update its card and stay
     * locked out forever — reported from a DEV test, 2026-08-19.
     *
     * Deliberately explicit rather than automatic on card-attach: the user presses a button that says
     * what it will cost, so a charge is never a surprise side-effect of saving a card.
     *
     * The status is NOT force-written here. On success Stripe emits `invoice.payment_succeeded`, and
     * that webhook is the single place that maps Stripe state onto `sBillingStatus` — two writers for
     * one field is how they drift. `iFailedAttempts` IS reset, because that counter is ours alone.
     */
    async payOutstanding(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sSchoolId } = res.locals;
        if (!assertStripe(res, next)) return;
        if (!await requireMainUser(res, next)) return;

        const oSchool = await BillingQueries.findSchoolBilling(sSchoolId);
        if (!oSchool) return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        if (!oSchool.sStripeCustomerId) {
            return next(new MyError(409, ErrorMessages.Billing.nothingToPay[sLang]));
        }

        // A card must be on file AND be the default — `invoices.pay()` charges the default one.
        const oCustomer: any = await stripe.customers.retrieve(oSchool.sStripeCustomerId);
        if (!oCustomer?.invoice_settings?.default_payment_method) {
            return next(new MyError(409, ErrorMessages.Billing.noDefaultCard[sLang]));
        }

        // The unpaid invoice. `open` is what an invoice sits at once Stripe's retries give up.
        const aOpen = await stripe.invoices.list({
            customer: oSchool.sStripeCustomerId,
            status: 'open',
            limit: 1
        });
        const oInvoice: any = (aOpen.data || [])[0];
        if (!oInvoice) {
            return next(new MyError(409, ErrorMessages.Billing.nothingToPay[sLang]));
        }

        let oPaid: any;
        try {
            oPaid = await stripe.invoices.pay(oInvoice.id);
        } catch (error: any) {
            // A decline is an expected outcome, not a server fault. 409 on purpose and NOT 402 —
            // the frontend treats 402 as "school suspended" and would bounce the user off the very
            // page they are trying to pay from.
            console.error(`billing/pay declined for school ${sSchoolId}:`, error?.message);
            return next(new MyError(409, ErrorMessages.Billing.paymentRetryFailed[sLang]));
        }

        // Ours to clear: the dunning counter. Status is left to the webhook.
        await BillingQueries.patchSchoolBilling(sSchoolId, { iFailedAttempts: 0 });

        return res.status(200).json({
            message: SuccessMessages.Billing.payOutstanding[sLang],
            results: {
                sInvoiceId: String(oPaid.id),
                dAmountPaid: fromStripeAmount(oPaid.amount_paid),
                sCurrency: String(oPaid.currency || BILLING_CURRENCY).toUpperCase(),
                bPaid: oPaid.paid === true,
                sStatus: String(oPaid.status)
            },
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
