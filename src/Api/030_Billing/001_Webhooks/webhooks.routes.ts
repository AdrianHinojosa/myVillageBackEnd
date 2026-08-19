import { Router } from "express";
import aH from "express-async-handler";
import WebhookController from './webhooks.controllers';

/**
 * Punto 3 — Stripe webhook endpoint.
 *
 * Mounted OUTSIDE the `:sLang` prefix and OUTSIDE every auth middleware, on purpose:
 * Stripe calls one fixed URL, sends no language and carries no bearer token. It authenticates by
 * signing the request body, which the controller verifies against STRIPE_WEBHOOK_SECRET.
 */
const router = Router();

router.post('/webhook', aH(WebhookController.handleWebhook));

export default router;
