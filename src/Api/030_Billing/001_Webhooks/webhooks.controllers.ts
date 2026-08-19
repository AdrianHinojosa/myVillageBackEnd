import { Response, Request, NextFunction } from 'express';

import BillingQueries from '../billing.queries';
import MailEvent from '../../../Services/Mail.service';
import stripe, {
    MAX_FAILED_ATTEMPTS,
    isStripeConfigured,
    fromStripeAmount,
    mapStripeStatus,
    fromStripeTimestamp
} from '../../../Services/Stripe.service';

/**
 * Punto 3 — Stripe webhooks.
 *
 * This is where subscription state actually changes. The endpoint is deliberately unusual:
 *
 *  - NO user authentication. It authenticates by verifying Stripe's signature over the raw request
 *    body, which is stronger than a bearer token here because only Stripe holds the signing secret.
 *  - NOT under the `:sLang` prefix. Stripe calls one fixed URL and sends no language.
 *  - Needs `req.rawBody`. `express.json()` would otherwise have already discarded the exact bytes
 *    the signature covers — see the `verify` hook in App.ts.
 *
 * It always answers 200 once the signature is valid, even if our own handling failed. A non-2xx
 * makes Stripe retry the same event for days, and a bug in our handler must not turn into a retry
 * storm. Failures are logged instead.
 */

/** Card details off an invoice, for the payment history. Best-effort: never block on this. */
async function getCardFromInvoice(oInvoice: any): Promise<{ sCardBrand: string, sLast4: string }> {
    try {
        const sChargeId = oInvoice?.charge;
        if (sChargeId) {
            const oCharge: any = await stripe.charges.retrieve(String(sChargeId));
            const oCard = oCharge?.payment_method_details?.card;
            if (oCard) return { sCardBrand: oCard.brand || '', sLast4: oCard.last4 || '' };
        }
    } catch (error: any) {
        console.error('Webhook: could not read card details from invoice:', error?.message);
    }
    return { sCardBrand: '', sLast4: '' };
}

/** A successful charge: record it, clear the failure counter, restore access. */
async function handleInvoicePaid(oInvoice: any): Promise<void> {
    const oSchool = await BillingQueries.findSchoolByStripeCustomer(String(oInvoice.customer));
    if (!oSchool) {
        console.error('Webhook invoice.paid: no school for customer', oInvoice.customer);
        return;
    }

    const oCard = await getCardFromInvoice(oInvoice);
    await BillingQueries.recordPayment({
        sSchoolId: oSchool.sSchoolId,
        dAmount: fromStripeAmount(oInvoice.amount_paid),
        sCurrency: String(oInvoice.currency || 'mxn').toUpperCase(),
        tPaidAt: fromStripeTimestamp(oInvoice.status_transitions?.paid_at || oInvoice.created),
        sStatus: 'succeeded',
        sCardBrand: oCard.sCardBrand,
        sLast4: oCard.sLast4,
        sStripeTransactionId: oInvoice.charge ? String(oInvoice.charge) : null,
        sStripeInvoiceId: String(oInvoice.id)
    });

    // A successful charge always clears delinquency. The contract: "el acceso se reactivará una vez
    // que el cobro sea procesado exitosamente."
    await BillingQueries.patchSchoolBilling(oSchool.sSchoolId, {
        sBillingStatus: oSchool.bCancelAtPeriodEnd ? 'CANCELED' : 'ACTIVE',
        iFailedAttempts: 0,
        tCurrentPeriodEnd: fromStripeTimestamp(oInvoice.lines?.data?.[0]?.period?.end) || oSchool.tCurrentPeriodEnd
    });
}

/**
 * A failed charge: count it, and suspend once the retries are exhausted.
 *
 * The contract allows the initial attempt plus two retries — three in total — then the account is
 * marked delinquent, the main user is emailed, and access is cut immediately with no grace period.
 * The count is kept here rather than inferred from Stripe's dunning settings, so the rule holds
 * regardless of how the dashboard is configured.
 */
async function handleInvoicePaymentFailed(oInvoice: any): Promise<void> {
    const oSchool = await BillingQueries.findSchoolByStripeCustomer(String(oInvoice.customer));
    if (!oSchool) {
        console.error('Webhook invoice.payment_failed: no school for customer', oInvoice.customer);
        return;
    }

    const iAttempts = (Number(oSchool.iFailedAttempts) || 0) + 1;
    const bExhausted = iAttempts >= MAX_FAILED_ATTEMPTS;

    const oCard = await getCardFromInvoice(oInvoice);
    await BillingQueries.recordPayment({
        sSchoolId: oSchool.sSchoolId,
        dAmount: fromStripeAmount(oInvoice.amount_due),
        sCurrency: String(oInvoice.currency || 'mxn').toUpperCase(),
        tPaidAt: fromStripeTimestamp(oInvoice.created),
        sStatus: 'failed',
        sCardBrand: oCard.sCardBrand,
        sLast4: oCard.sLast4,
        sStripeTransactionId: oInvoice.charge ? String(oInvoice.charge) : null,
        sStripeInvoiceId: String(oInvoice.id)
    });

    await BillingQueries.patchSchoolBilling(oSchool.sSchoolId, {
        iFailedAttempts: iAttempts,
        sBillingStatus: bExhausted ? 'SUSPENDED' : 'PAST_DUE'
    });

    // Notify the main user — the contract names them specifically as the recipient.
    const oMainUser: any = await BillingQueries.findMainSchoolUser(oSchool.sSchoolId);
    if (oMainUser?.sEmail) {
        MailEvent.emit('SendEmail', {
            aEmails: [oMainUser.sEmail],
            oData: {
                sFullName: `${oMainUser.sName || ''} ${oMainUser.sLastName || ''}`.trim(),
                sSchoolName: oSchool.sName || '',
                dAmount: fromStripeAmount(oInvoice.amount_due).toFixed(2),
                sCurrency: String(oInvoice.currency || 'mxn').toUpperCase(),
                iAttempts,
                iMaxAttempts: MAX_FAILED_ATTEMPTS,
                bSuspended: bExhausted,
                sUrl: `${process.env.URL_TYPE || 'https'}://${process.env.SCHOOLS_PLATFORM || ''}/admin/billing`
            },
            sType: 'billingPastDue',
            sSubject: bExhausted
                ? 'My Village — Suscripción suspendida por falta de pago'
                : 'My Village — No pudimos procesar tu pago'
        });
    }
}

/** Subscription updated/deleted in Stripe: mirror its status onto the school. */
async function handleSubscriptionChanged(oSub: any): Promise<void> {
    const oSchool = await BillingQueries.findSchoolByStripeSubscription(String(oSub.id))
        || await BillingQueries.findSchoolByStripeCustomer(String(oSub.customer));
    if (!oSchool) {
        console.error('Webhook subscription change: no school for subscription', oSub.id);
        return;
    }

    const sStatus = mapStripeStatus(oSub.status, oSub.cancel_at_period_end === true);
    const oPatch: any = {
        sBillingStatus: sStatus,
        bCancelAtPeriodEnd: oSub.cancel_at_period_end === true,
        tCurrentPeriodEnd: fromStripeTimestamp(oSub.current_period_end)
    };
    // A subscription that is fully gone leaves no id behind to reference.
    if (oSub.status === 'canceled') {
        oPatch.sStripeSubscriptionId = null;
    }

    await BillingQueries.patchSchoolBilling(oSchool.sSchoolId, oPatch);
}

class Controllers {
    constructor() {};

    /** POST {env}/api/v1/billing/webhook — Stripe only. */
    async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        if (!isStripeConfigured()) {
            console.error('Webhook received but Stripe is not configured.');
            return res.status(503).json({ message: 'Stripe is not configured.' });
        }

        const sSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const sSignature = req.headers['stripe-signature'] as string;
        const rawBody = (req as any).rawBody;

        if (!sSecret) {
            console.error('Webhook rejected: STRIPE_WEBHOOK_SECRET is not set.');
            return res.status(503).json({ message: 'Webhook secret is not configured.' });
        }
        if (!rawBody) {
            // Means the express.json() verify hook is missing — a deployment problem, not Stripe's.
            console.error('Webhook rejected: raw body unavailable, cannot verify the signature.');
            return res.status(400).json({ message: 'Raw body unavailable.' });
        }

        let oEvent: any;
        try {
            oEvent = stripe.webhooks.constructEvent(rawBody, sSignature, sSecret);
        } catch (error: any) {
            // Unverified: could be a forgery. Refuse, and do not process anything.
            console.error('Webhook signature verification FAILED:', error?.message);
            return res.status(400).json({ message: `Webhook signature verification failed.` });
        }

        // From here the event is authentic. Answer 200 whatever happens next — a non-2xx would make
        // Stripe retry this same event for days.
        try {
            switch (oEvent.type) {
                case 'invoice.paid':
                case 'invoice.payment_succeeded':
                    await handleInvoicePaid(oEvent.data.object);
                    break;
                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(oEvent.data.object);
                    break;
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    await handleSubscriptionChanged(oEvent.data.object);
                    break;
                default:
                    // Everything else is acknowledged and ignored on purpose.
                    break;
            }
        } catch (error: any) {
            console.error(`Webhook handling failed for ${oEvent.type}:`, error?.message, error?.stack);
        }

        return res.status(200).json({ received: true });
    }
}

export default new Controllers();
