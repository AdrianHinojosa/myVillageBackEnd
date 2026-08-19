import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import BillingController from './billing.controllers';
import * as BillingValidations from './billing.validations';
import { verifySchoolUserPermissions, denyFacultyAccess } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

/**
 * Punto 3 — the school's own subscription panel.
 *
 * Every route resolves the school from `res.locals.sSchoolId`, so a school can only ever reach its
 * own billing. FACULTY is excluded throughout — billing is not a teacher's concern — and the
 * mutating routes additionally require the school's MAIN user, checked inside the controllers
 * because it needs a database lookup.
 *
 * The webhook is NOT here: it has no user auth and no language prefix, so it is mounted separately
 * in Index.routes.ts.
 */
const router = Router({ mergeParams: true });

/**
 * A suspended school must still be able to pay its way out (reported from a DEV test, 2026-08-19).
 *
 * The suspension gate in `verifySchoolUserPermissions` answers 402 for every school route, and that
 * included these — so the 402 message said "regulariza el pago" while blocking every endpoint that
 * could take the payment. A suspension nobody can exit is a termination.
 *
 * `POST /cancel` is deliberately NOT in this set: cancelling while delinquent should not be the way
 * out, and the contract keeps the account and its data intact regardless.
 */
const RECOVERY = { bAllowWhenSuspended: true };

// GET /billing/summary — plan, status and the official monthly total
router.get('/summary',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    aH(BillingController.getSummary));

// GET /billing/payments — charge history
router.get('/payments',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    celebrate({ query: BillingValidations.GetPaymentsQuery }),
    aH(BillingController.getPayments));

// GET /billing/payment-methods — saved cards
router.get('/payment-methods',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    aH(BillingController.getPaymentMethods));

// POST /billing/setup-intent — client secret for Stripe.js card entry
router.post('/setup-intent',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    aH(BillingController.createSetupIntent));

// POST /billing/payment-methods — attach a tokenised card
router.post('/payment-methods',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    celebrate({ body: BillingValidations.AttachPaymentMethodBody }),
    aH(BillingController.attachPaymentMethod));

// PUT /billing/payment-methods/:sPaymentMethodId/default
router.put('/payment-methods/:sPaymentMethodId/default',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    celebrate({ params: BillingValidations.PaymentMethodIdParams }),
    aH(BillingController.setDefaultPaymentMethod));

// DELETE /billing/payment-methods/:sPaymentMethodId
router.delete('/payment-methods/:sPaymentMethodId',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    celebrate({ params: BillingValidations.PaymentMethodIdParams }),
    aH(BillingController.detachPaymentMethod));

/**
 * POST /billing/pay — pay the outstanding invoice now ("Reintentar pago").
 *
 * The way a suspended school gets back in. Stripe's automatic retries are already exhausted by the
 * time we suspend, and adding a card does NOT make Stripe charge anything, so without this endpoint
 * updating the card achieved nothing and the school stayed locked out.
 *
 * Exempt from the suspension gate, and main-user only like every other mutating billing route.
 */
router.post('/pay',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }], RECOVERY)),
    aH(denyFacultyAccess() as any),
    aH(BillingController.payOutstanding));

// POST /billing/cancel — cancel at the end of the paid period, never immediately
router.post('/cancel',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(denyFacultyAccess() as any),
    aH(BillingController.cancelSubscription));

export default router;
