# Implementation Tracker — Ampliación de alcance (cerrada 24/jul/2026)

**Branch:** `features02Aug2026`
**Backend repo:** `myVillageBackEnd`
**Started:** 2026-08-02
**Scope source of truth:** `futureFeatures/NewScopeAug2026/My Village_ Ampliación de alcance -  Cerrado 24_Julio_2026  (1).pdf`
**Frontend contract docs:** `futureFeatures/NewScopeAug2026/Front_*.md`

> **Companion files**
> - [`featureGuide.md`](featureGuide.md) — plain-language explanation of each feature for the frontend team
> - [`frontEndChanges.md`](frontEndChanges.md) — everything the frontend must change to integrate

---

## Status board

| # | Punto | Backend weight | Status | Commit |
|---|---|---|---|---|
| 10 | Tickets de soporte | 1 endpoint + SES email + shared auth gate | ✅ Done | `271e9a1` |
| 8 | Tipos de ayuda | child table `TrackingRecordHelps` (Model B) | ✅ Done | `e1efd72` |
| 5 | Modo terapeuta | 1 column + login payload + enforcement | ✅ Done | `4a8a577` |
| 7 | Submetas | schema + endpoints + calculated fields | ✅ Done | `c303c03` + `58a6534` |
| 3 | Cobranza automática (Stripe) | full module + webhooks + dunning | ⬜ Not started — buildable on test keys; **live keys needed to ship** | — |
| 11 | Guía de creación de metas | none (frontend only) | ➖ N/A backend | — |
| 13 | Módulo de capacitaciones | none (frontend only) | ➖ N/A backend | — |

Legend: ⬜ not started · 🔄 in progress · ✅ done & committed · ➖ no backend work · ⛔ blocked

---

## Progress — as of 2026-08-07

### Backend: ~32%

Weighted by the contract's own prices (what the client actually paid per point).

| # | Punto | Price | Backend done | Notes |
|---|---|---|---|---|
| 10 | Tickets de soporte | $8,000 | ✅ **100%** | shipped `271e9a1` |
| 8 | Tipos de ayuda | $14,000 | ✅ **100%** | `e1efd72` — child table + array wire + legacy shim, 39 checks green |
| 5 | Modo terapeuta | $14,000 | ✅ **100%** | `4a8a577` — column + login + enforcement, verified end-to-end |
| 7 | Submetas | $24,000 | ✅ **100%** | `Goals` + `sParentGoalId`, 5 endpoints, 12 leak guards, 39 checks green |
| 3 | Cobranza (Stripe) | $70,000 | ⬜ 0% | last point; buildable now on test keys |
| 11 | Guía de metas | $5,500 | ➖ n/a | frontend only |
| 13 | Capacitaciones | $11,000 | ➖ n/a | frontend only |

- **By point price:** backend-relevant scope $130,000 · delivered $60,000 (P10 + P5 + P8 + P7) → **46.2%**
- **By estimated backend effort share** (P3 70%, P7 50%, P8 35%, P10 55%, P5 15% of each
  point's price): $23,400 of $72,400 → **32.3%**

**32% is the honest figure**; 46% flatters it. Plainly: *four of five backend points done. The one
that remains — P3 Stripe — is 54% of contract value and ~68% of the remaining backend effort.*

### Overall project (frontend + backend): ~62%

| Side | Est. share of scope | Complete | Contribution |
|---|---|---|---|
| Frontend | ~$74,100 | ~90% | ~$66,700 |
| Backend | ~$72,400 | ~32% | ~$23,400 |
| **Total** | **$146,500** | | **~$90,100 → ~62%** |

Frontend has **dropped** from ~93% to ~90% as integration work surfaced: the P8 Model B decision
invalidated its record capture, chart colouring and PDF export (entry 1); therapist mode needs the
record-attach control hidden (entry 5); and **subgoals have no status control at all** (entry 7),
which leaves a contract requirement unreachable. Five open items in `frontEndChanges.md`.

⚠️ The front/back effort splits are **estimates**, so treat ~62% as ±5. The backend 32% is firm.

### Remaining backend effort

| Point | Estimate | Blocked? |
|---|---|---|
| P5 | ~~0.5 day~~ | ✅ **done** |
| P8 | ~~1 day~~ | ✅ **done** |
| P7 | ~~2–3 days~~ | ✅ **done** |
| P3 | ~5–8 days | No longer blocked for development — test keys confirmed; live keys before ship |
| **Total** | **~5–8 days (≈1–1.5 working weeks)** | |

Contract allows **4 working weeks**. P3 is 54% of contract value and more than half the remaining
effort; it is now unblocked for development (test-mode keys), but **live keys are still needed
before it can ship**.

---

## Environment / repo findings recorded at kickoff (2026-08-02)

These are facts discovered while reading the code, kept here so nobody re-derives them.

1. **The frontend IS complete for all 7 points — verified against `origin/mainCopy` @ `d560e21`.**
   A local clone can be stale: `root/myVillage` was sitting on `21feafe` (31/mar/2026) and showed
   zero hits for every new field. After `git fetch`, `origin/mainCopy` is at `d560e21`
   *"Cobranza automática con Stripe (P3) — frontend + guía cerrada"*, with commits for each point:
   `bf9c4e2` P10 · `c16702a` P8 · `ac06460` P5 · `42543af` P7 · `d560e21` P3 ·
   `17ca0a3` P11+P13. **Always `git fetch` the frontend before reading its code.**

   The frontend guide copies under `futureFeatures/NewScopeAug2026/Front_*.md` were also stale
   (264-line guide vs. 361 in the repo — missing the entire closed P3 contract). They were
   re-mirrored from `origin/mainCopy:docs/addons-julio2026/` on 2026-08-02. **Re-mirror before
   trusting them again.**

2. **Verified frontend↔backend wire facts** (read from frontend source, not from its docs):
   - `app/utils/helpTypes.ts` — 8 slugs, lowercase Spanish: `independiente | ayuda_general |
     visual | verbal | escrita | gestual | modelacion | fisica`, each with a hex colour.
   - `app/utils/records.ts` — `mapRecordFromBackend` reads `oRecord.sHelpType`;
     `mapRecordToBackend` sends `sHelpType` + `iHelpAmount`. Read side is tolerant (`|| ''`).
   - `app/utils/subGoals.ts` — `ISubGoal` includes `iTargetPercentage`, `sStatus` typed
     `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED`, `MAX_SUBGOALS = 5`, and the rollup is computed
     **client-side** (`getSubGoalsRollup`) from `dProgress` + `iRecordsCount` per subgoal.
   - **List response envelope:** `SubGoalsManager.vue` reads
     `oResponse.data.aData || oResponse.data.results || oResponse.data`. Returning the
     project's usual named key (`subGoals: [...]`) would fall through to the raw object and
     **break** `aRaw.map(...)`. So subgoal list endpoints must return **`aData`**.
     `/billing/summary` reads `data.results || data.oData || data`.
   - `app/stores/auth.ts` — `IUser` already declares `sAccountType?` and `sBillingStatus?`;
     `login.vue:105-106` reads them from `oResults.oSchool`.
   - `schools/[id]/edit.vue` — already sends and reads `sAccountType`, `sBillingMode`,
     `dFixedAmount`, `dAmountPerTeacher`, `dAmountPerStudent`, `dDiscountPct`.
   - Endpoint paths confirmed identical to the guide (grep of `$api.*` calls).

3. **P3 scope grew: the PO chose BOTH billing modalities.** The guide (§P3) states both `FIXED`
   and `VARIABLE` are supported, selectable per school, and the frontend ships the selector. The
   signed PDF says the modalities are *"alternativas y NO acumulables — el cliente deberá
   seleccionar una sola"* and prices only the variable one ($70,000). Supporting both is a
   superset, so it satisfies the contract, but it is a scope change to acknowledge.

4. **`TrackingRecords.sSupportUsed` already exists** (migration `3021_TrackingRecords.ts:10`) with
   the comment `INDEPENDENT|GENERAL|VISUAL|VERBAL|WRITTEN|GESTURAL|MODELING|PHYSICAL` — i.e. the
   exact 8 help types of Punto 8. It is never read or written by any query. Punto 8 should adopt
   it instead of adding the frontend's proposed new `sHelpType` column.

5. **`Goals.sStatus` could not be set to `PAUSED` through the API — FIXED in `58a6534`.** The DB
   comment allowed `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED` but `CompleteGoalBody` validated
   only three, so `PAUSED` was unreachable. Added for goals, and subgoals accept all four via
   `PUT /subGoals/:sSubGoalId`.

6. **`Goals` had no `iTargetPercentage` column — FIXED in `c303c03`.** The signed PDF lists
   "porcentaje objetivo (0–100)" and `ISubGoal` declares it, but the column did not exist. Added to
   `Goals` (so it serves goals and subgoals alike) and accepted on all four write endpoints.

7. **Progress is denormalized and computed in one place.**
   `Goals.dProgress / dAverageValue / iRecordsCount / tLastRecord` are stored columns, recomputed
   inside the write transaction by `TrackingRecordQueries.recalculateGoalProgress()` — a ~140-line
   function branching on `sMeasurementType` × `sDirection`, averaging the **last 3 non-excluded**
   records. This function must not be duplicated for subgoals.

8. **Superadmin cannot pass `verifySchoolUserPermissions`.** School and administrator tokens go
   through different middleware (`schools.permissions.ts` vs `Permissions.mw.ts`
   `verifyAdminPermissions`). Any endpoint that must serve both (e.g. the support ticket form)
   needs a new combined gate.

9. **Email is fire-and-forget.** `MailEvent.emit('SendEmail', …)` swallows SES errors inside the
   listener, so a controller cannot know whether delivery succeeded.

10. **Stripe groundwork already exists.** `package.json` ships `stripe@^11.3.0`, and `.env`
    already defines `STRIPE_PRIVATE_KEY` / `STRIPE_PUBLIC_KEY` (values unverified — could be
    placeholders from the SHIPO template this repo forked from; confirm before P3). `node-cron`
    is also installed, which covers the recurring-charge scheduler. **Still missing for P3:** the
    raw-body handling a webhook signature check requires, and any Stripe code at all.

11. **An unused SMS service already exists.** `src/Services/SMS.services.ts` wraps AWS SNS
    (`SMSService.emit('sendSMS', sPhone, sMessage)`) using `aws-sdk` v2 — note the mail service
    uses the v3 `@aws-sdk/client-ses` instead. It is imported nowhere. `.env` defines
    `ADMIN_PHONE`. Reusable as-is for P10 SMS notifications.

12. **Database targets — RESOLVED 2026-08-02.** `.env` originally pointed at `DB_NAME='production'`
    on the live RDS `myvillagedb.ckz88o2wq1ur.us-east-1.rds.amazonaws.com`, which meant
    `npm run db:migrations` would have altered production (`NODE_ENV=development` selects the
    knexfile's `development` profile, which reads those same `DB_*` vars — it is not a separate
    database). The PO switched `DB_NAME` to **`development`**, a genuinely separate database on the
    same host, verified as: 33/33 migrations applied, 26 tables in `myvillageschema`, and realistic
    data (30 Users, 12 Schools, 8 Students, 41 Goals, 74 TrackingRecords).
    ⚠️ **Same host and same DB user as production** — only `DB_NAME` separates them. Re-check
    `DB_NAME` before every migration run.

13. **The production build is broken, independently of this scope.** `.babelrc` enables
    `@babel/plugin-transform-runtime`, which rewrites helpers to `require('@babel/runtime/...')`,
    but `@babel/runtime` is in neither `dependencies` nor `devDependencies` and is absent from
    `node_modules`. `npm run build` succeeds, then `node dist/server.js` dies with
    `Cannot find module '@babel/runtime/helpers/interopRequireDefault'`. Either the deploy host
    installs it out-of-band or deploys use `ts-node`. Not fixed here — out of scope, and changing
    it affects deployment. Flagged to the PO 2026-08-02.

14. **`tsc --noEmit` is not a build gate here.** The build is Babel (types stripped, never
    checked) and the repo carries ~40 pre-existing type errors. Verification standard adopted for
    this scope: *`npm run build` must succeed and the diff must add zero new `tsc` errors* —
    checked per feature.

15. **🚨 EVERY Joi error label MUST have an entry in `ValidationError.util.ts`, or the request
    returns HTTP 500.** The label is a lookup key of the form `"<Group> <field>"`, and
    `ErrorHandler.mw.ts:131` does `Messages[err.type][type][message][langCode]` with **no guard**.
    A missing entry throws `Cannot read properties of undefined (reading 'sp')` → 500.
    **This shipped in P10 and P5** (`Support sSubject/sMessage/sCategory`, `Schools sAccountType`)
    and was only caught while testing P8; fixed for all three in the P8 commit.
    Two testing lessons: validation surfaces as **409**, not 400; and it must be exercised
    **through HTTP with a valid token** — auth (401) and permission gates (403) run before
    `celebrate` and mask the bug, which is exactly why the earlier P10/P5 tests missed it.
    Recorded in `WORKING_AGREEMENT_SKILL.md` §2.7.

16. **`SMS.services.ts` had never been executed and did not work.** Two bugs, both fixed on
    2026-08-07 when P10 activated it: the SNS client was built with `new SNS({})` *before*
    `AWS.config.update()` ran — aws-sdk v2 captures config at construction, so it had no region
    and no credentials — and the `.catch()` returned without settling the promise. ⚠️ AWS SNS
    accounts start in a **sandbox** that can only send to verified numbers; if
    `+528181377416` is not verified in the SNS console, sends fail silently (fire-and-forget).

17. **`npm run db:migrations` is BROKEN — use `npx knex migrate:latest` from the repo root.**
    The script is `cd src && knex migrate:latest`, which makes knex pick up `src/knexfile.ts`
    (tracked) whose `path.join(__dirname, '/knex/db/migrations')` resolves to
    `src/knex/db/migrations` — a directory that does not exist. It fails with
    `ENOENT ... scandir '.../src/knex/db/migrations'`. The **root** `knexfile.ts` resolves
    correctly, so running `npx knex migrate:latest` (and `migrate:list`, `migrate:rollback`)
    from the repo root works. That is how migration `3033` was applied. Either delete
    `src/knexfile.ts` or change the npm script — needs PO approval since it touches tooling.

18. **Out of scope but present:** the frontend repo added `docs/BACKEND_FEEDBACK_02APR2026.md`
    (413 lines), `BACKEND_FEEDBACK_LOGIN_USERTYPE.md`, `BACKEND_FIX_STUDENT_REPORT.md`,
    `BACKEND_TODO_25MAR2026.md` and `CLIENT_ISSUES_02APR2026.md`. These predate this scope and
    are **not** part of the 24/jul/2026 extension. Do not silently fold them in.

---

## Decisions log

| # | Topic | Decision | Rationale | Date |
|---|---|---|---|---|
| Q2 | P7 subgoal storage | **Subgoals are `Goals` rows with `sParentGoalId`** (not a separate `SubGoals` table) | Reuses `recalculateGoalProgress()`, `GoalTasks` and `GoalFiles` instead of duplicating the 140-line measurement engine. Frontend contract (`/subGoals/...`, `sSubGoalId`) unchanged — responses carry both `sGoalId` and `sSubGoalId`. | 2026-08-02 |
| Q3 | P7 sequencing | **Independent statuses**, as the frontend built — no "one active at a time", no "close to advance" | PO decision. ⚠️ Deviates from the signed PDF p.3, which specifies a sequential machine. Logged in "Deviations" below. | 2026-08-02 |
| Q1 | P8 help type | **Model B — many help types per record, each with its own 0–10 value** | PO decision, backed by the client mock-up. ⚠️ Contradicts what the frontend built (a single `sHelpType` + `iHelpAmount`) and its own guide ("un solo tipo por registro"). Frontend rework required — see `frontEndChanges.md`. | 2026-08-02 |
| Q10 | P10 audience | **Any authenticated user** (SchoolAdmin, FACULTY, SuperAdmin) via a new `verifyAnyAuthenticatedUser()` gate | PO decision; matches the PDF, which places the button in the top bar every user sees. | 2026-08-02 |
| — | P10 SMS | **Wired but disabled**, behind `SUPPORT_SMS_ENABLED` + `SUPPORT_PHONE` | PO asked for SNS "left prepared". No destination number provided yet, so it must not send. | 2026-08-02 |
| — | P8 chart colour | **Colour the chart point by the highest-value help type**; ties broken by the canonical 8-type order | PO decision. Keeps the contract's "one colour per point" rule workable under Model B with **no API change** — the backend returns the array, the frontend picks the max. | 2026-08-02 |
| — | P8 enum casing | **UPPERCASE codes in the DB** (`VISUAL`), frontend keeps its lowercase slugs (`visual`), mapped at the API boundary | Convention call (naming, not business logic). Matches `sStatus`/`sMeasurementType`/`sDirection` and the vocabulary already documented on `sSupportUsed`. Zero frontend impact — this codebase already translates names at the boundary (`iCorrect`↔`iHits`). | 2026-08-02 |
| — | P8 legacy shim | `POST`/`PUT` also accept the **old single** `sHelpType` + `iHelpAmount` and store it as a one-item array | Backend and frontend deploy independently; without this the existing capture form breaks the moment the backend ships. Marked in code for removal once the frontend ships the new UI. | 2026-08-02 |
| — | P8 `sSupportUsed` | **Left in place, marked superseded** — not dropped | It holds a single value so it cannot serve Model B, but dropping a column from a production schema is irreversible and needs its own approval. | 2026-08-02 |
| Q6 | P5 enforcement | **Backend enforces** the therapist restrictions (403 on `POST /schoolUsers`, `POST /iep`, `GET /iep`, `POST /goals/:id/goalFiles`) | PO decision. "Hidden in the UI" is not the same as "not possible"; the contract states these as product limits. `res.locals.sAccountType` is set by the auth middlewares (which already fetch the school), so the gate costs no extra query. | 2026-08-02 |
| Q8 | P3 Stripe keys | **Develop against the existing test-mode keys**; live keys before deploy | `.env` holds `sk_test_`/`pk_test_` MyVillage keys, so no real money can move during development. P3 is therefore **not** blocked on credentials. | 2026-08-02 |
| — | P5 record files | **Not blocked** for therapists; raised as Q15 | The contract's "no podrá cargar documentos" arguably covers record attachments, but `RecordForm.vue` has no therapist gating — blocking would make a visible button fail. Better to ask than to introduce a UI bug. | 2026-08-02 |
| — | P5 `PUT /schools` | `sAccountType` is patched **only when present** in the body | Patching unconditionally would silently reset a therapist account to `SCHOOL` on any unrelated school edit. | 2026-08-02 |
| Q13 | P10 SMS | **Enabled** with `SUPPORT_PHONE=+528181377416`, fires on every ticket | PO provided the number "to begin". ⚠️ AWS SNS starts in a sandbox that can only reach *verified* numbers — verify this one in the SNS console or sends fail silently. | 2026-08-07 |
| — | `SMS.services.ts` | **Fixed two latent bugs** while activating it | (a) `new SNS({})` was constructed *before* `AWS.config.update()`; aws-sdk v2 captures config at construction, so the client had no region and no credentials and every publish would have failed. (b) The error path returned without resolving or rejecting, leaving the promise permanently unsettled. Never caught because nothing imported this file until P10. | 2026-08-07 |
| — | P8 storage | **Child table `TrackingRecordHelps`**, UPPERCASE codes stored / lowercase slugs on the wire, uniqueness enforced in Joi *and* Postgres | A record holds several types, so no scalar column works; 8 fixed columns would be unqueryable. Casing matches the rest of the schema while leaving the frontend untouched. | 2026-08-07 |
| — | P8 legacy shim | `POST`/`PUT` still accept the single `sHelpType` + `iHelpAmount` | Backend and frontend deploy independently; without it the current capture form breaks on deploy. Marked for removal. | 2026-08-07 |
| — | P8 list read | Help types fetched for **all** records in one `whereIn`, grouped in memory | `formatRecordsForFrontend` is already N+1 for tasks and files; adding a third per-record query would have made it worse. | 2026-08-07 |
| Q14 | Build | **`@babel/runtime@^7.29.7` added to `dependencies`** | `.babelrc` enables `@babel/plugin-transform-runtime`, which emits `require('@babel/runtime/...')`. Without the package a clean `npm ci && npm run build && npm start` crashed — production could not deploy. ⚠️ **Must be `^7`**: `npm install` defaults to `^8.0.0`, which dropped the `./regenerator` subpath the Babel 7 transform emits, and the app fails to boot. Verified booting and serving after pinning to 7. | 2026-08-07 |
| Q15 | P5 uploads | **Therapists blocked from ALL document uploads**, including tracking-record attachments | PO decision. The contract states it without qualification: *"el terapeuta no podrá cargar documentos"*. My earlier reading — that it might mean goal documents only — was over-cautious. Profile images (student photo, account logo) remain allowed: they are pictures, not documents. | 2026-08-07 |
| — | Upload gate order | `denyTherapistAccess()` placed **before** `upload()` on both file routes | A rejected request must not buffer the uploaded file into memory first. On `POST /trackingRecords/:id/files` the auth check itself also ran *after* `upload()` — now fixed, so unauthenticated uploads no longer consume memory. | 2026-08-07 |
| — | P7 records | A **divided** goal refuses records posted with `sGoalId` (409); they must use `sSubGoalId` | Contract: *"la meta principal no tiene registros propios cuando está dividida"*. Allowing both would double-report progress — the parent's own `dProgress` and the subgoal rollup would each count the same work. | 2026-08-07 |
| — | P7 inherited fields | Subgoal schema **strips** `sTitle`, `sMeasurementType`, `bHasSubGoals`, `aDocuments` instead of rejecting them | The frontend reuses `GoalForm.vue` for subgoals and always sends all four. Rejecting would 409 the form; ignoring keeps title/measurement inherited as the contract requires. | 2026-08-07 |
| — | P7 `PAUSED` | Added to `CompleteGoalBody` so it is reachable for goals too | Finding 5: the DB allowed `PAUSED` but the API never did. Subgoals need all four states, and there was no reason for goals to lack one. | 2026-08-07 |
| — | Docs | Added **`featureGuide.md`** — plain-language explanation of each feature for the frontend team | PO request: explain in understandable terms what was built (tables, endpoints, behaviour), not just what changed. | 2026-08-02 |

---

## Open questions blocking work

Tracked here as they are asked/answered. See the conversation for full phrasing.

| ID | Punto | Question | Status |
|---|---|---|---|
| Q1 | 8 | ~~Single vs multiple help types per record~~ | ✅ **Answered** — Model B (many per record, 0–10 each) |
| Q2 | 7 | ~~Subgoal storage~~ | ✅ **Answered** — `Goals` rows with `sParentGoalId` |
| Q3 | 7 | ~~Sequential vs independent subgoals~~ | ✅ **Answered** — independent, as the frontend built (deviation logged) |
| Q4 | 7 | `iTargetPercentage`: add to subgoals only, or to `Goals` as well (it's missing there too)? | ⬜ Open |
| Q5 | 7 | Allow `PAUSED` on the existing goal status endpoint too, or only on subgoals? | ⬜ Open |
| Q6 | 5 | ~~Enforce therapist restrictions, or only expose the flag?~~ | ✅ **Answered** — enforce server-side |
| Q7 | 3 | Both billing modalities (`FIXED` + `VARIABLE`) is what the frontend built and the guide states, but the signed PDF says they are *"alternativas y NO acumulables"* and prices only the variable. Confirm both are in scope. | ⬜ Open |
| Q8 | 3 | ~~Stripe keys~~ | ✅ **Answered** — `.env` holds MyVillage **test-mode** keys (`sk_test_`/`pk_test_`); build against test, live keys to be provided before deploy |
| Q9 | 3 | Is "usuario principal del colegio" the school user with `sCreatedBy === null`? (that's the only marker in the schema) | ⬜ Open |
| Q10 | 10 | ~~Support ticket audience~~ | ✅ **Answered** — any authenticated user |
| Q11 | 3 | Who creates the Stripe subscription, and when? On first card added, or when the superadmin sets the tariff? The guide never says. | ⬜ Open |
| Q12 | 3 | Suspension enforcement: block at login only (frontend redirect), or also reject every API call from a `SUSPENDED` school (`bBlocked`-style gate in the middleware)? | ⬜ Open |
| Q13 | 10 | ~~SMS destination number~~ | ✅ **Answered** — `+528181377416`, enabled, fires on every ticket |
| Q14 | — | ~~`@babel/runtime` missing from `dependencies`~~ | ✅ **Answered & FIXED** — `@babel/runtime@^7.29.7` added; `npm run build && npm start` now boots (verified). ⚠️ Must be `^7`, not `^8` |
| Q15 | 5 | ~~Block therapists from attaching files to tracking records?~~ | ✅ **Answered** — YES, blocked. Contract says *"no podrá cargar documentos"* plainly. Frontend must hide the dropzone (frontEndChanges entry 5) |
| Q16 | — | `npm run db:migrations` is broken (see finding 17). Approve deleting the stale `src/knexfile.ts`, or changing the npm script to not `cd src`? | ⬜ Open |

---

## Per-point implementation notes

### Punto 10 — Tickets de soporte ✅

**Commit:** `271e9a1` · **Migration:** none (the scope explicitly excludes persistence)

**What it does.** A logged-in user submits subject + message + optional category; the backend
identifies them from their token, emails the support inbox, and returns a localized confirmation.
No ticket table, no admin panel, no history — the signed PDF puts those in a separate proposal.

**Endpoint.** `POST /support/ticket` → `200 { message, success }`
Body: `sSubject` (required, ≤120), `sMessage` (required, ≤1000),
`sCategory` (optional, `technical|question|suggestion|other`).
Matches the frontend contract in `Front_API_CONTRATO_TICKETS_SOPORTE.md` exactly.

**Files**
| File | Purpose |
|---|---|
| `src/Api/029_Support/support.validations.ts` | Joi `SendTicketBody` |
| `src/Api/029_Support/support.controllers.ts` | `sendTicket` — resolves reporter, emits email + optional SMS |
| `src/Api/029_Support/support.routes.ts` | `POST /ticket` |
| `src/Middlewares/001_Permissions.mw.ts/shared.permissions.ts` | **new** `verifyAnyAuthenticatedUser()` |
| `src/Views/supportTicket.html` | Handlebars email template |
| `src/Api/004_Users/users.queries.ts` | **added** `getUserContactById` |
| `src/Api/000_Index/Index.routes.ts` | mounts `support` |
| `src/Services/Mail.service.ts` | `'supportTicket'` added to the `sType` union |
| `src/Utils/SuccessMessage.util.ts` | `Support.sendTicket` (`sp`/`en`) |
| `src/Utils/ErrorMessages.util.ts` | `Support.reporterNotFound`, `Support.sendTicketFailed` |

**Decisions taken**

1. **New shared auth gate rather than loosening the school gate.** School users and
   administrators authenticate through different middlewares against different tables, so no
   existing gate serves both. `verifyAnyAuthenticatedUser()` resolves the session against the
   school audience first (most traffic), falls back to the administrator audience, and populates
   the same `res.locals` shape each specific middleware would have. Loosening
   `verifySchoolUserPermissions` instead would have weakened every school endpoint.
2. **A blocked school can still file a ticket.** Deliberate: `verifySchoolUserPermissions` 404s
   users of a blocked school, so a suspended school can log in but do nothing. Refusing support
   tickets too would leave them no way to ask for help — exactly when they most need it. The gate
   still requires a valid, unexpired session, and the endpoint only sends an email.
3. **Identity is never read from the body.** Reporter name/email/phone come from
   `getUserContactById(res.locals.sUserId)`; school name from `res.locals.sSchoolId`. The Joi
   schema is strict (`JoiObjectKeys`), so a body carrying `sUserId`/`sSchoolId` is rejected
   outright — verified by test.
4. **HTTP 200, not the project's usual 201.** Nothing is created. The guide specifies 200 and the
   frontend treats any 2xx the same.
5. **Email template is Spanish-only.** It goes to one inbox (`info@myvillage.com.mx`), and the
   existing templates (`newSchool`, `forgotPassword`) are Spanish-only too. The reporter's
   interface language ships as a field so support knows which language to reply in.
6. **SMS is wired but off.** Reuses the pre-existing unused `Services/SMS.services.ts` (AWS SNS).
   Fires only when `SUPPORT_SMS_ENABLED === 'true'` **and** `SUPPORT_PHONE` is set, so nothing
   sends until support opts in. ⚠️ Destination number still to be provided.

**New environment variables** (all optional, safe defaults)
| Var | Default | Purpose |
|---|---|---|
| `SUPPORT_EMAIL` | `info@myvillage.com.mx` | ticket destination inbox |
| `SUPPORT_SMS_ENABLED` | *(off)* | `'true'` to enable the SNS heads-up |
| `SUPPORT_PHONE` | *(none)* | E.164 destination for the SMS |

**Verification**
- `npm run build` succeeds; `tsc --noEmit` shows **0 new** errors from these files.
- Template renders with sample data: 14,098 bytes, **no unresolved `{{placeholders}}`**.
- Joi: 8/8 cases pass (length caps, required fields, invalid category, body-spoof rejection).
- Live via supertest: route mounts at `/development/api/v1/:sLang/support/ticket`;
  401 with no/garbage token, 404 on an unknown subpath, and messages localize (`sp`→Spanish,
  `en`→English).
- **Not verified:** the authenticated happy path and real SES delivery — both need a valid
  session against a non-production database (see finding 12).

**Known limitation.** `MailEvent` is fire-and-forget: `Mail.service.ts` catches SES errors and
only logs them, so the success message means *"we accepted your report"*, not *"the email was
delivered"*. Making this reportable would change behaviour for every existing email — raised with
the PO, not done unilaterally.

### Punto 8 — Tipos de ayuda ✅

**Commit:** `e1efd72` · **Migration:** `3034_TrackingRecordHelps.ts` (applied to `development`)

**What it does.** Each tracking record can document several kinds of support, each scored 0–10.
Purely documental — it must never move progress, average or record count, and that is *proved*
below rather than asserted.

**Schema.** New child table `TrackingRecordHelps`:
`sTrackingRecordHelpId` (PK) · `sTrackingRecordId` (FK, notNullable) · `sHelpType` (notNullable) ·
`iHelpAmount` (int, notNullable, default 0) · audit + timestamps ·
**unique(`sTrackingRecordId`,`sHelpType`)** so the "one row per type per record" rule is enforced by
Postgres, not only by Joi · index on `sTrackingRecordId`.

**Wire.** No new endpoints — three existing ones gained `aHelpTypes`:
`POST /trackingRecords` · `PUT /trackingRecords/:sTrackingRecordId` ·
`GET /goals/:sGoalId/trackingRecords`.
```jsonc
"aHelpTypes": [ { "sHelpType": "visual", "iHelpAmount": 8 }, { "sHelpType": "verbal", "iHelpAmount": 7 } ]
```
POST: omitting it stores nothing. PUT: sending it **replaces** the set, `[]` **clears** it,
omitting it **preserves** it.

**Files**
| File | Change |
|---|---|
| `knex/db/migrations/3034_TrackingRecordHelps.ts` | **new** table |
| `src/Api/024_Goals/003_TrackingRecords/helpTypes.ts` | **new** — vocabulary, slug↔code maps, `normalizeHelpTypesInput`, `formatHelpTypesForFrontend` |
| `src/Api/024_Goals/003_TrackingRecords/trackingRecordHelps.model.ts` | **new** model |
| `trackingRecords.model.ts` | `TrackingRecordHelps` HasMany relation (thunk, avoids circular import) |
| `trackingRecords.validations.ts` | `aHelpTypes` array + legacy scalars, on Create and Update |
| `trackingRecords.queries.ts` | `replaceRecordHelpTypes`, `findRecordHelpTypes`; wired into insert/update; **batched** read in `formatRecordsForFrontend` |
| `src/Utils/ValidationError.util.ts` | `TrackingRecords.{aHelpTypes,sHelpType,iHelpAmount}`, `TrackingRecordHelps.*`, **plus the missing `Support.*` and `Schools.sAccountType` from P10/P5** |

**Decisions taken**

1. **Child table, not 8 columns.** One record holds several types, so a scalar column cannot serve.
   Eight fixed columns would be rigid and unqueryable for reporting.
2. **UPPERCASE codes stored, lowercase slugs on the wire.** `VISUAL` in the database (matching
   `sStatus`/`sMeasurementType`/`sDirection` and the vocabulary already documented on
   `sSupportUsed`); `visual` on the wire so the frontend needs no change. Mapped in `helpTypes.ts`.
3. **Uniqueness enforced twice** — Joi `.unique('sHelpType')` for a friendly message, plus a DB
   constraint so no code path can bypass it.
4. **Legacy shim retained.** `POST`/`PUT` still accept single `sHelpType` + `iHelpAmount` and store
   it as a one-item array, so the frontend keeps working between deploys. Marked for removal.
5. **Batched list read.** `formatRecordsForFrontend` already does N+1 for tasks and files; help
   types are fetched for **all** records in one `whereIn` and grouped in memory rather than adding
   another query per record.
6. **`sSupportUsed` left in place**, marked superseded — it holds a single value so it cannot serve
   this model, and dropping a live column needs its own approval.
7. **Help types are written before `recalculateGoalProgress`** in the same transaction —
   deliberately, to make it obvious in the code that the recalculation does not read them.

**Verification** — 39 checks against the real development database with a genuine session token:
- multi-type create; UPPERCASE storage vs lowercase wire; ordering by amount desc
- rejections (all clean 409 with localized messages, **no 500s**): duplicate type, amount 11,
  amount −1, non-integer 2.5, unknown slug, 9 items
- accepted: amount 0, all 8 types at once
- legacy shim: single value → one-item array, stored as `MODELING`; out-of-range legacy rejected
- `PUT` replace / preserve-on-omit / clear-on-`[]`; DB row counts confirmed
- batched list read returns all 8 for a record
- **calculation invariance, properly proved** on an `EXACTITUD` goal: record 9/10 → `dProgress`
  70.00; adding 4 help types at 10 each → still 70.00; clearing them → still 70.00; and a *sanity*
  check changing the measurement 9/10 → 2/10 moved it to 35.00, proving the test can detect
  movement, so the three unchanged readings are real evidence
- cleanup verified: 0 leftover help rows, 0 goal counter drift

### Punto 5 — Modo terapeuta ✅

**Commit:** `4a8a577` · **Migration:** `3033_Schools_sAccountType.ts` (applied to `development`)

**What it does.** An account is `SCHOOL` or `THERAPIST`. The superadmin sets it; login exposes it
so the frontend can switch terminology; and the backend **enforces** the three restrictions the
contract places on therapist accounts.

**Schema.** `Schools.sAccountType` string `notNullable` default `'SCHOOL'`. All 12 existing rows
backfilled to `SCHOOL` by the default — verified post-migration.

**Files**
| File | Change |
|---|---|
| `knex/db/migrations/3033_Schools_sAccountType.ts` | **new** — adds the column |
| `src/Api/022_Schools/schools.model.ts` | `sAccountType` on interface + class |
| `src/Api/022_Schools/schools.validations.ts` | **new** exported `AccountType` Joi enum, added to Create + Update bodies |
| `src/Api/022_Schools/schools.queries.ts` | `insertSchool` defaults to `SCHOOL`; `updateSchool` patches it **only when sent** |
| `src/Api/022_Schools/schools.controllers.ts` | destructures and forwards `sAccountType` |
| `src/Api/003_Authentication/authentication.controllers.ts` | `sAccountType` added to `oSchool` |
| `src/Middlewares/001_Permissions.mw.ts/schools.permissions.ts` | sets `res.locals.sAccountType`; **new** `denyTherapistAccess()` |
| `src/Middlewares/001_Permissions.mw.ts/shared.permissions.ts` | sets `res.locals.sAccountType` for parity |
| `src/Middlewares/001_Permissions.mw.ts/Permissions.mw.ts` | `sAccountType` added to the `Response.locals` type |
| `src/Api/026_SchoolUsers/schoolUsers.routes.ts` | `denyTherapistAccess()` on `POST /` |
| `src/Api/025_Ieps/ieps.routes.ts` | `denyTherapistAccess()` on `POST /` and `GET /` |
| `src/Api/024_Goals/002_GoalFiles/goalFiles.routes.ts` | `denyTherapistAccess()` on `POST /` |
| `src/Utils/ErrorMessages.util.ts` | `Schools.therapistNotAllowed` (`sp`/`en`) |

**Decisions taken**

1. **Enforced server-side, per PO instruction.** The frontend guide called enforcement optional.
   Enforcing makes the contract's limit real instead of cosmetic — otherwise anyone with a token
   could create a second user on a therapist account.
2. **`sAccountType` is carried in `res.locals`, set by the auth middlewares.** Those already fetch
   the school (`verifySchoolExists`) to check `bBlocked`, so `denyTherapistAccess()` reads locals
   and adds **zero** database queries. Alternative — querying the school inside the gate — would
   have added a query to every gated request.
3. **`GET /iep` is blocked too, not just writes.** The contract says *"no podrá **visualizar** o
   utilizar"*. Verified safe: the frontend's `fetchIep()` is `silent: true` with an empty
   `.catch()`, so the 403 produces no user-visible error.
4. **`PUT /schools/:id` omitting `sAccountType` preserves the current value.** Patching it
   unconditionally would silently reset therapist accounts to `SCHOOL` on any unrelated edit.
5. **Record file attachments deliberately NOT blocked.** `RecordForm.vue` has no therapist gating,
   so the attach button is visible to therapists; blocking server-side would break a working
   flow. Raised as Q15 instead of deciding unilaterally.
6. **Student photos and school logos NOT blocked** — images, not documents; a therapist still
   needs an avatar and a logo.
7. **`POST /schoolUsers` only.** `PUT /schoolUsers/:id` stays open — the rule is about creating
   *additional* users, and a therapist must still be able to edit their own record.

**Verification** (real development DB, genuine minted session token)
- Migration applied; 12/12 existing schools defaulted to `SCHOOL`.
- As `SCHOOL`: none of the four endpoints blocked.
- As `THERAPIST`: `GET /iep`, `POST /iep`, `POST /schoolUsers`, `POST /goals/:id/goalFiles` all
  `403` with the localized message.
- As `THERAPIST`: `GET /students` → 201, `POST /support/ticket` → 200 (not over-blocked).
- Login returns `sAccountType` in `oSchool` for both types; `oSchool` keys are
  `sSchoolId, sSchoolName, sSchoolLogo, oImages, sAccountType`.
- Invalid enum rejected; omitting the field on `PUT` preserves the type.
- `npm run build` succeeds, zero new `tsc` errors.
- Test data fully restored: all accounts back to `SCHOOL`, borrowed password hash restored,
  test sessions deleted — confirmed by re-query.

### Punto 7 — Submetas 🔄 (in progress)

**Commits:** `c303c03` (schema + guards) · `58a6534` (endpoints) · **Migration:** `3035_Goals_subGoals.ts`

#### Step 1 of 2 — schema + leak-proofing ✅

A subgoal is a **`Goals` row with `sParentGoalId`** set (Q2 decision), so the existing progress
engine, `GoalTasks`, `GoalFiles` and the TrackingRecords pipeline all serve subgoals unchanged.

**New columns on `Goals`**
| Column | Purpose |
|---|---|
| `sParentGoalId` | uuid, nullable, FK → `Goals.sGoalId`. NULL = top-level goal. Indexed. |
| `iOrder` | int, default 0 — display order within the parent (not user-reorderable, PO decision) |
| `bHasSubGoals` | bool, default false — **stored, not derived** |
| `iTargetPercentage` | int, nullable — listed in the signed PDF but previously missing from `Goals` |

`bHasSubGoals` is stored rather than derived from a child count because the frontend marks a goal
as divided **at creation time, before any subgoal exists**; a derived flag would report `false`
during that window and the UI would show the wrong screen.

**⚠️ CORRECTION to an earlier estimate.** I told the PO the leak risk was "one `WHERE` clause".
It is **12 predicates across 3 modules** — every query that lists or aggregates goals must exclude
children, or subgoals appear as independent goals and are double-counted in analytics:

| File | Sites | What would have broken |
|---|---|---|
| `024_Goals/goals.queries.ts` | 2 | `findGoalsByStudent` (subgoals listed as goals) + the folio search precompute |
| `023_Students/students.queries.ts` | 4 | `iGoalsCount` and `dGoalsProgress`, in both the list and single-student queries |
| `022_Schools/schools.queries.ts` | 8 | `iGoals`, `sGoalsProgress`, `iGoalProgress`, `dCurrentGoalProgress`, `iCurrentCompleted`, `iPrevCompleted`, and the created/completed monthly trend counts |

All 12 are in place. They were added **before** any subgoal can exist, deliberately, so no window
exists in which a subgoal could pollute a report.

**Verification** — the guards being no-ops today proves nothing, so they were tested by inserting
a synthetic child row with `dProgress = 999` and re-reading the real endpoints and aggregates:
- goals list `iTotal` 23 → 23; the subgoal did **not** appear in the returned array
- student `iGoalsCount` 23 → 23; `dGoalsProgress` stayed 50 (not poisoned above 100)
- school-level aggregate: **guarded** count/avg 22/49 → 22/49, while the **unguarded** form went
  22/49 → 23/**90** — proving the guard holds *and* that the test could detect a leak
- pre/post migration aggregates identical to the recorded baseline
  (`25 goals, avg 50.00, 23 active, 1 completed`); all 41 existing rows have `sParentGoalId` NULL
  and `bHasSubGoals` false
- synthetic rows removed; rows with a parent back to 0

#### Step 2 of 2 — endpoints ✅
`GET/POST /goals/:sGoalId/subGoals` · `PUT/DELETE /subGoals/:sSubGoalId` ·
`GET /subGoals/:sSubGoalId/trackingRecords` · `POST /trackingRecords` accepting `sSubGoalId` ·
`bHasSubGoals` on `GET /goals/:id`.

**Module:** `src/Api/024_Goals/004_SubGoals/` (validations, queries, controllers, routes — **no
model**, it reuses `GoalsModel`). Collection routes are nested in `goals.routes.ts`; the
`/subGoals` item routes are mounted in `Index.routes.ts`.

**All three integration breaks found in step 1 are fixed:**
1. `POST /goals` accepts `bHasSubGoals` (+ `iTargetPercentage`) — the divide flow works now.
2. `POST /trackingRecords` takes `sGoalId` **xor** `sSubGoalId`; a subgoal id resolves to the same
   `sGoalId` downstream, so `recalculateGoalProgress` needed no change whatsoever.
3. The subgoal schema **strips** `sTitle`, `sMeasurementType`, `bHasSubGoals` and `aDocuments`
   rather than 409-ing, because the frontend reuses `GoalForm.vue` and always sends them.

**Business rules enforced:** max 5 · one nesting level · title and measurement type inherited and
immutable · independent statuses incl. `PAUSED` · a divided parent refuses direct records · delete
cascades to records · creating a subgoal marks the parent divided.

**Also fixed:** `PAUSED` is now reachable on `PATCH /goals/:id/complete` (finding 5 — the DB always
allowed it, the API never did).

**Verification:** 39/39 checks green — inheritance, id remapping, `iOrder`, the 5 cap, nesting
refusal, `aData` envelopes, calculated fields, **subgoals absent from the goals list while the
parent is present**, records via `sSubGoalId` yielding real progress (80%), divided-parent 409,
partial-edit preservation, `PAUSED`, delete cascade, and 404s including using a goal id on a
subgoal route. Cleanup verified: 0 leftover subgoal rows, 0 counter drift.

**Contract facts established from frontend source** (`SubGoalsManager.vue`, `GoalForm.vue`):
1. The subgoal form **is** `GoalForm.vue` with `bIsSubGoal`, so a subgoal payload is a *goal*
   payload. It sends `sTitle` (empty — the input is hidden), `sMeasurementType` (the inherited one),
   `bHasSubGoals`, `aDocuments` and `aTasks`. The subgoal schema must **accept and ignore** the
   first four rather than 409 on them: title and measurement type are inherited, documents go
   through the separate upload endpoint, and a subgoal cannot itself be divided.
2. **`POST /goals` currently REJECTS the frontend's payload.** `GoalForm` sends `bHasSubGoals` on
   create, `CreateGoalBody` is a strict `JoiObjectKeys`, and `"bHasSubGoals" is not allowed`
   (confirmed by running the validator). So the "divide into subgoals?" flow is broken against the
   current backend until `bHasSubGoals` is accepted.
3. **`POST /trackingRecords` needs to accept `sSubGoalId` in place of `sGoalId`.**
   `SubGoalsManager.vue:360` posts `{ sSubGoalId, ...oPayload }` and `RecordForm` does not supply
   `sGoalId`, which is currently `RequiredUUID` — so the request would fail validation.
4. Lists must return **`aData`** (`SubGoalsManager.vue:285` falls through to the raw response object
   otherwise and then calls `.map()` on it).

### Punto 3 — Cobranza automática (Stripe)
*(not started)*

---

## Deviations from the signed requirements document

Anything we build differently from the PDF gets logged here with who approved it.

| Punto | PDF says | We build | Approved by | Date |
|---|---|---|---|---|
| 7 | Submetas are **sequential**: only one active at a time, must close one to advance; main goal progress = active subgoal (PDF p.3) | Frontend built independent statuses, no sequencing; main progress = average of *started* subgoals, completes when all closed | ⛔ **Pending client confirmation** (Q3) | — |
| 3 | The two modalities are *"alternativas y NO acumulables — el cliente deberá seleccionar una sola"*; only the variable one is priced ($70,000) | Frontend built a per-school selector supporting **both** `FIXED` and `VARIABLE` | ⛔ **Pending confirmation** (Q7) — superset, so contract is satisfied, but acknowledge the change | — |
| 11 | Static **image** provided by client, editable only in frontend code | Frontend built a programmed guided builder (8 coloured segments) instead | Noted — frontend-only, no backend impact | 2026-08-02 |
| 13 | Videos uploaded **statically**, modifiable only from frontend code | Frontend ships `public/data/trainings.json` + `app/utils/trainings.ts` | Noted — frontend-only, no backend impact | 2026-08-02 |

---

## Commit log

*(one row per commit on `features02Aug2026`)*

| Commit | Point | Summary |
|---|---|---|
| `db2ea9c` | — | Scope kickoff: working-agreement skill, CLAUDE.md pointers, both trackers |
| `7a01cd7` | — | Corrected kickoff findings against the real frontend (`d560e21`); re-mirrored the guides; registered the invocable skill |
| `271e9a1` | **10** | `POST /support/ticket` + SES template + `verifyAnyAuthenticatedUser()` gate; SMS wired but disabled |
| `3c5e4d8` | — | `featureGuide.md` (plain-language feature doc) + resolved decisions |
| `07f535c` | — | Measured progress recorded in the tracker |
| `4a8a577` | **5** | `Schools.sAccountType` + login payload + `denyTherapistAccess()` on 4 endpoints |
| `a0dd135` | 10 | Enabled support SMS (+528181377416); fixed two latent bugs in `SMS.services.ts` |
| `e1efd72` | **8** | `TrackingRecordHelps` child table + `aHelpTypes` wire + legacy shim; **fixed the 500-on-validation crash shipped in P10/P5** |
| `d657335` | 5 / build | `@babel/runtime` dependency (deployment unblocked) + therapists blocked from record-file uploads |
| `c303c03` | **7** | Subgoal schema + 12 leak guards across goals/students/schools |
| `58a6534` | **7** | SubGoals module: 5 endpoints + 3 integration fixes + business rules |
