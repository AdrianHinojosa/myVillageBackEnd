# shipoBack
Back-End of My Village

---

## Deploying

There is **no CI configuration in this repository** — no workflow files, no Docker, no Procfile, no
`.ebextensions`. Deployment is manual, and these are the steps in order. Skipping step 3 is the usual
way a deploy looks fine and serves wrong data.

```bash
git fetch origin
git checkout <branch>          # the branch this environment serves
git pull

npm ci                         # not `npm install` — see the @babel/runtime note below
npm run build                  # babel src -> dist
npm run db:migrations          # apply pending migrations (uses NODE_ENV from .env)
npm start                      # node dist/server.js
```

### 1. `npm ci`, not `npm install`

`.babelrc` enables `@babel/plugin-transform-runtime`, which emits `require('@babel/runtime/...')`, so
the package must be present **and pinned to `^7`**. `npm install @babel/runtime` resolves to `^8`,
which dropped the `./regenerator` subpath the Babel 7 transform emits, and the app fails to boot. The
pin is in `package.json`; `npm ci` respects the lockfile and cannot drift.

### 2. Migrations per environment

| Target | Command |
|---|---|
| the environment named in `.env` (`NODE_ENV`) | `npm run db:migrations` |
| production explicitly | `npm run db:migrations:prod` |

> `npm run update-prod-migrations` is **not** a migration runner. It is a one-off utility that
> renumbers rows in `knex_migrations` when migration file prefixes collide. Do not use it to deploy.

### 3. Recompute derived progress when the rules change

`Goals.dProgress`, `dAverageValue`, `iRecordsCount` and `tLastRecord` are a **cache** of a
calculation. Migration `3039` recomputes them by calling `src/scripts/recalculateProgress.ts`, which
means it needs the TypeScript sources present — true for a normal repo deploy, not true if only
`dist/` was shipped. The call is wrapped in a `try`, so a failure is a warning, not a crash:

```
3039: could not run the progress recomputation (...). Run "npm run recalc:progress" to complete it.
```

If you see that line, run `npm run recalc:progress`. If you do not, nothing is pending. Either way the
script is safe to re-run.

### 4. Environment variables that change behaviour silently

| Variable | If missing |
|---|---|
| `STRIPE_PRIVATE_KEY` | every `/billing/*` endpoint that talks to Stripe returns **503**; the rest still work |
| `STRIPE_WEBHOOK_SECRET` | webhook signature verification fails, so subscription state changes (paid, failed, suspended) **never arrive** |
| `SUPPORT_SMS_ENABLED`, `SUPPORT_PHONE` | support tickets stop sending SMS — silently, by design |
| the AWS/SES ones | dunning and support email is fire-and-forget: SES errors are logged, never surfaced |

None of these stop the server from booting, which is exactly why they are worth checking after a
deploy rather than assuming.

---

## Testing

```bash
npm run test:stripe              # all files  (~75s, 183 assertions)
npm run test:stripe -- 01        # a single file
npm run test:stripe -- 01 05     # several

npm run test:subgoals            # all files  (~60s, 133 assertions)
npm run test:subgoals -- 02      # a single file
```

There is also a maintenance script, not a test:

```bash
npm run recalc:progress          # recompute every goal's stored progress with the current rules
```

`Goals.dProgress` and friends are a **cache** of a calculation. When the calculation itself changes,
rows written under the old rules stay stale until something touches that goal again — which for a
finished goal is never. This recomputes them all, calling the real engine rather than reimplementing
it, and is safe to re-run. Migration `3039` invokes it automatically, so a deploy does not depend on
anyone remembering.

Exit code is `0` only if every assertion passed **and** the suite left no residue in the database.

### What exists today

| Suite | Location | Covers |
|---|---|---|
| **Punto 3 — Cobranza automática (Stripe)** | `src/unitTests/StripeSubscriptions/` | Billing: tariff config, the suspension gate, card management, subscriptions, webhooks, dunning, and the trial→charge lifecycle |
| **Punto 7 — Sequential subgoals** | `src/unitTests/SubGoalsRollup/` | The sequential stage machine, a divided goal mirroring its stage in progress, each subgoal's own title, the average window (all records, not the last 3), and the student report finding subgoal records |

Full breakdown of every file in
[`src/unitTests/StripeSubscriptions/README.md`](src/unitTests/StripeSubscriptions/README.md) and
[`src/unitTests/SubGoalsRollup/README.md`](src/unitTests/SubGoalsRollup/README.md).

### These are integration tests

They drive the **real Express app** (via supertest, so requests pass through auth → celebrate →
controller → error handler), the **real development database**, and the **real Stripe sandbox** —
actual customers, prices, subscriptions and signed webhook payloads.

That is deliberate. The bugs this feature actually had were only findable this way: a Joi validation
label with no entry in `ValidationError.util.ts` returned **HTTP 500** instead of a clean error, and
`stripe.paymentMethods.attach()` returns a *different* id than the one passed in. Neither would
surface against a mock.

### ⚠️ Safety — read before running

Both suites refuse to run against any database but `development`, and both fail the run if they
leave anything behind. `test:subgoals` creates goals, subgoals and tracking records titled
`ZZTEST-P7…` and hard-deletes them in teardown; it never touches pre-existing rows.

The Stripe suite **mutates real rows**: it patches school tariffs, sets `sBillingStatus` (including
`SUSPENDED`, which locks every user of that school out), inserts payment history, and creates Stripe
objects. Two guards run before anything else:

| Guard | Behaviour |
|---|---|
| Database | **Aborts unless `current_database() === 'development'`.** `.env` in this project has pointed at `production` before — this guard is not theoretical. |
| Stripe | **Aborts if `STRIPE_PRIVATE_KEY` starts with `sk_live_`.** |

Teardown is guaranteed: each file snapshots the school row it touches and restores all 15
billing-related columns in a `finally` block; the runner then deletes minted sessions, removes every
Stripe object it created, and **re-queries the database to prove nothing was left behind**. A dirty
result fails the run, so repeated use cannot quietly corrupt the development data.

Fixtures are selected from existing rows, never created, so the database does not grow on each run.

### Requirements

| | |
|---|---|
| `DB_NAME=development` | Required — the suite refuses any other database |
| `STRIPE_PRIVATE_KEY` | A `sk_test_…` key. **Without it, files 04–07 skip themselves** and 01–03 still run |
| `STRIPE_WEBHOOK_SECRET` | Optional. If absent, a local secret is generated for the process; payloads are still signed with Stripe's own helper, so the real verification path runs |

### Not covered

- **Real webhook delivery.** Signatures are verified with Stripe's own signing algorithm, so the
  handler is genuinely tested — but Stripe's servers reaching the deployed URL is dashboard
  configuration, not code.
- **Actual email delivery.** `Mail.service.ts` is fire-and-forget: SES errors are logged, never
  surfaced. The tests prove an email was *dispatched*, not that it *arrived*.
- **The browser card step.** `stripe.confirmCardSetup()` runs in the frontend; here a payment method
  is created server-side from a test token, which yields the same kind of id.

### Adding another suite

1. Create `src/unitTests/<Feature>/` with numbered files, each default-exporting
   `async function run(): Promise<void>`.
2. Use the `check` / `checkTrue` / `section` / `skip` helpers so results roll into one summary.
3. Snapshot and restore anything you mutate, in a `finally` block.
4. Add a `test:<feature>` script to `package.json`.

`src/unitTests/StripeSubscriptions/helpers.ts` is a working reference — safety guards, fixture
selection, token minting and cleanup tracking are all reusable.

> **Note:** these live under `src/`, so `npm run build` compiles them into `dist/` too. They are never
> imported by `server.ts` and are inert in production. To exclude them, add `--ignore src/unitTests`
> to the `build` script.

### Other verification in this scope

The Aug-2026 scope extension (P5, P7, P8, P10) was verified with roughly 130 further assertions run
as throwaway scripts — subgoal leak guards, the measurement-engine invariance proof, help-type
storage, therapist enforcement. **Those were not kept**, so they do not protect against regressions.
Only the billing suite above is permanent. See
`documentationForFront/NewScopeAug2026/implementationTracket.md` for what each point was checked
against.
