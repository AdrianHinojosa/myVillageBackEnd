# Punto 3 — Cobranza automática (Stripe): test suite

Integration tests for the billing module. **183 assertions across 7 files, ~75 seconds.**

```bash
npm run test:stripe              # everything
npm run test:stripe -- 01        # one file
npm run test:stripe -- 01 05     # several
```

Exit code is `0` only if every assertion passed **and** the suite left no residue behind.

---

## What these are, and are not

These are **integration** tests, not unit tests in the isolated sense. They drive:

- the **real Express app** (`import app from '../../App'` + supertest), so every request goes through
  the whole chain — auth → celebrate → controller → error handler
- the **real development database**
- the **real Stripe sandbox** — actual customers, prices, subscriptions and signed webhook payloads

That is deliberate. The bugs this feature actually had were only findable this way: a validation
label with no message-catalogue entry returned **500** instead of a clean error, and
`paymentMethods.attach` returned a *different* id than the one passed in. Neither would surface
against a mock.

There is no jest dependency: the suite must run **serially and in order** (a subscription has to
exist before cards can be switched), and teardown has to be guaranteed. A plain runner does that
more predictably.

---

## Safety

The suite mutates school rows — including setting `sBillingStatus = 'SUSPENDED'`, which locks users
out — and creates Stripe objects. Two guards run before anything else:

| Guard | Behaviour |
|---|---|
| `assertSafeDatabase()` | **Aborts unless `current_database() === 'development'`.** `.env` in this project has pointed at `production` before, so this is not theoretical. |
| `assertSafeStripe()` | **Aborts if `STRIPE_PRIVATE_KEY` starts with `sk_live_`.** |

Every file snapshots the school row it touches and restores all 15 billing-related columns in a
`finally` block. The runner then deletes minted sessions, removes every Stripe object it created, and
**re-queries the database to prove nothing was left behind** — stray payments, stray customer ids, or
any school still `SUSPENDED`. A dirty result fails the run.

### Fixtures are created and destroyed, not borrowed

Each file creates **its own school** (plus a main user and a second administrative user), tagged
`ZZTEST-STRIPE`. The runner destroys every one of them at both the **start** and the **end** of a run,
and the residue check counts them, so an interrupted run cannot quietly leave schools behind.

It used to choose the first real school with a main user and restore its columns afterwards. That
stopped being safe the moment a Stripe **webhook endpoint went live**: the deployed dev API receives
real Stripe events and writes to this same `development` database, so an event can land mid-run and
overwrite the exact column an assertion is about. A dedicated school removes that class of collision —
nobody is clicking through it and nothing else references it.

The one row still borrowed is a superadmin, used only to mint a token for `PUT /schools`. Nothing
about it is modified.

---

## Requirements

| | |
|---|---|
| `DB_NAME=development` | Required. The suite refuses anything else. |
| `STRIPE_PRIVATE_KEY` | A `sk_test_…` key. **Without it, files 04–07 skip themselves** and 01–03 still run. |
| `STRIPE_WEBHOOK_SECRET` | Optional. If absent, a local secret is generated for this process; payloads are still signed with Stripe's own `generateTestHeaderString`, so the real verification path is exercised. |

---

## The files

### `01_money.ts` — pure logic, no I/O
The most consequential file: it guards the amount actually charged. `computeMonthlyTotal()` is a
deliberate mirror of the frontend's function in `app/utils/billing.ts`, because the frontend
*previews* the figure and the backend *charges* it — divergence means billing a school something
other than what it was shown.

Covers both modalities, discount clamping at both ends, centavo conversion including float dust
(`12.005 → 1201`), all nine Stripe→our status mappings, and the contract constants (MXN, 30-day
trial, 3 attempts).

### `02_schoolsConfig.ts` — tariff, login, suspension *(no Stripe)*
Superadmin sets a tariff; omitting fields on `PUT` **preserves** them rather than wiping; invalid
values return a localized **409** and never a 500; `GET` returns the tariff and status.

Then the suspension gate: `SUSPENDED` → **402** for every user, while `NONE`, `TRIALING`, `ACTIVE`,
`PAST_DUE` and `CANCELED` each keep access — asserted individually. And **support tickets still work
while suspended**, which is deliberate: it is the only route a locked-out school has to a human.

### `03_billingEndpoints.ts` — reads and permissions *(no Stripe)*
`GET /billing/summary` returns every `IBillingSummary` key with the `results` envelope the frontend
reads, and `iTeachersLimit` correctly mapped from the `iUsersLimit` column. `GET /billing/payments`
returns every `IPayment` key with the `aData` envelope and numeric amounts. Payment recording is
idempotent. The main-user rule holds true for the main user and false for another user of the same
school. A malformed payment-method id is rejected before it can reach the Stripe SDK.

### `04_cards.ts` — cards and subscription *(Stripe)*
Lazy customer creation, SetupIntent client secret, and the first card starting the subscription with
a trial **measured at exactly 30 days**. Verifies the Stripe price is `1170000` centavos / `mxn` /
monthly. Second card, default switching — and that the switch propagates to the **subscription**, or
the next renewal would still use the old card. Non-default detach allowed; **last-card detach refused
(409)** because it would guarantee the next renewal fails; another customer's card rejected (404).
Cancel sets `cancel_at_period_end` **without** cancelling outright, and access continues.

### `05_webhooks.ts` — signatures, dunning, idempotency *(Stripe)*
Forged and missing signatures rejected with 400. Then the dunning ladder: failures 1 and 2 →
`PAST_DUE` **with access intact**; failure 3 → `SUSPENDED` + 402, while support tickets still return
200. A successful charge clears the counter and restores access. **Three deliveries of the same event
leave exactly one payment row.** All five status mappings, `subscription.deleted` clearing the id, and
an unknown customer answering 200 rather than crashing — because a non-2xx makes Stripe retry the
same event for days.

### `06_tariffSync.ts` — price changes apply next cycle *(Stripe)*
This covers a bug that existed: a tariff change never reached Stripe, so the next renewal would have
charged the old amount **forever**. Now a change creates a new Price, repoints the subscription, and
the upcoming invoice contains **zero proration line items** — the contract requires the invoiced
period stay untouched. A no-op change is skipped rather than creating a junk price, and a school with
no subscription still saves successfully, reporting why.

### `07_trialAndCharge.ts` — the full monthly cycle *(Stripe, slow)*
Uses a **Stripe test clock** to fast-forward 31 days on Stripe's servers. Proves nothing is charged
during the trial, the subscription flips `trialing → active`, and **a real charge of `1170000`
centavos actually happens**. Without this the first renewal would be entirely unverified — the trial
simply would not have expired yet.

Polls while Stripe settles the clock, which is why this file dominates the runtime.

---

## What is still NOT covered

**Real webhook delivery.** Payloads here are signed with Stripe's own algorithm, so the handler is
genuinely verified — but Stripe's servers reaching the deployed URL is dashboard configuration, not
code. Register an endpoint at `{env}/api/v1/billing/webhook`, put its `whsec_…` in the environment,
and use *Send test webhook* to confirm.

**Actual email delivery.** The dunning email is dispatched, and the template renders correctly in
both its branches, but `Mail.service.ts` is fire-and-forget: SES errors are logged, never surfaced.
So these tests prove the email was *sent*, not that it *arrived*.

**The browser card flow.** `stripe.confirmCardSetup()` runs in the frontend. Here a payment method is
created server-side from a Stripe test token, which produces the same kind of id — so the endpoints
are exercised exactly as the frontend calls them, but the Stripe.js step itself is not.

---

## A note on placement

These live under `src/`, so `npm run build` compiles them into `dist/` as well. They are never
imported by `server.ts`, so they are inert in production — but if you would rather not ship them,
add `--ignore src/unitTests` to the `build` script.
