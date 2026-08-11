import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

/**
 * Punto 3 — Cobranza automática.
 *
 * Note what is NOT here: no card number, expiry or CVC. The browser confirms a SetupIntent with
 * Stripe.js and sends us only the resulting payment-method id, so raw card data never reaches this
 * server and the backend stays out of PCI scope.
 */

// Stripe payment-method ids look like `pm_1AbC...`. Constrained so a stray value cannot be handed
// straight to the Stripe SDK.
export const PaymentMethodIdParams = Validations.JoiObjectKeys({
    sPaymentMethodId: Joi.string().trim().pattern(/^pm_[A-Za-z0-9_]+$/).required()
        .error(new Error("Billing sPaymentMethodId")),
    sLang: Joi.string(),
});

export const AttachPaymentMethodBody = Validations.JoiObjectKeys({
    sPaymentMethodId: Joi.string().trim().pattern(/^pm_[A-Za-z0-9_]+$/).required()
        .error(new Error("Billing sPaymentMethodId")),
});

// The frontend sends `{}` — accepted, and nothing else is.
export const EmptyBody = Validations.JoiObjectKeys({});

export const GetPaymentsQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
});
