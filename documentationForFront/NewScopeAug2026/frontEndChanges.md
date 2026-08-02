# Frontend Changes Required — Ampliación de alcance (Aug 2026)

**Backend branch:** `features02Aug2026`
**Maintained by:** backend team
**Purpose:** every change the **frontend** must make so that the two sides integrate. One entry per
change, actionable on its own.

> **How to read an entry:** *Endpoint* → what the frontend does **today** (per its own guide) →
> what it **must** do instead → **why**. If "why" isn't convincing, push back; don't silently
> diverge.

> **Companion:** [`implementationTracket.md`](implementationTracket.md) — what the backend built and why.

---

## Reference point (2026-08-02)

Verified against **`origin/mainCopy` @ `d560e21`** ("Cobranza automática con Stripe (P3)"), where
all 7 points are implemented. Entries below were checked against **frontend source**, not only its
docs — file and line references point into that commit.

⚠️ *Note for whoever reads this next:* a local frontend clone goes stale fast. `git fetch` before
comparing — this backend was initially reading `21feafe` (31/mar) and wrongly concluded the
frontend work didn't exist.

---

## Summary table

| # | Punto | Endpoint / area | Change | Severity |
|---|---|---|---|---|
| — | — | — | *(none yet — populated as features land)* | — |

Severity: 🔴 breaking (integration fails without it) · 🟡 rename/adapt · 🟢 nice-to-have

---

## Pending changes

*(none yet — the first entries land with Punto 10 / Punto 8)*

---

## Proposed changes awaiting PO decision

These are **not yet confirmed** — they are the backend's recommendation, pending an answer to the
matching open question in `implementationTracket.md`.

### P8 — Help type: storage column and enum casing 🟢 *(pending Q1 — frontend impact: none)*

- **Endpoints:** `POST /trackingRecords`, `PUT /trackingRecords/:sTrackingRecordId`, and every
  GET that returns records.
- **Frontend today** (`app/utils/records.ts:88-92`, `app/utils/helpTypes.ts`): sends
  `sHelpType` + `iHelpAmount`, with lowercase Spanish slugs
  `independiente | ayuda_general | visual | verbal | escrita | gestual | modelacion | fisica`.
  Reads `oRecord.sHelpType || ''` (tolerant).
- **Backend recommendation:** **keep the wire exactly as-is** — frontend sends and receives
  `sHelpType` with its slugs, unchanged. Internally store into the **existing**
  `TrackingRecords.sSupportUsed` column using the project's UPPERCASE codes
  (`VISUAL`, `GENERAL`, `MODELING`, …), translating slug↔code at the API boundary.
- **Why:** `sSupportUsed` **already exists** (migration `3021_TrackingRecords.ts:10`) documented
  with exactly these 8 values, and is currently dead code. Adding a second `sHelpType` column
  would leave two columns for one concept and introduce the schema's only lowercase enum
  (`sStatus`, `sMeasurementType`, `sDirection` are all UPPERCASE). The boundary map is ~10 lines
  and this codebase already does exactly this kind of translation
  (`iCorrect`↔`iHits`, `dtDate`↔`tRecordDate`, `sNotes`↔`sObservations`).
- **Frontend impact:** **none.** Listed here for transparency only.
- **If rejected:** we add `sHelpType` as its own column with the lowercase slugs and
  `sSupportUsed` stays dead — also zero frontend impact, just a worse schema.

### P7 — Subgoal storage 🟢 *(pending Q2 — frontend impact: none)*

- **Endpoints:** `GET/POST /goals/:sGoalId/subGoals`, `PUT/DELETE /subGoals/:sSubGoalId`,
  `GET /subGoals/:sSubGoalId/trackingRecords`, `POST /trackingRecords` with `sSubGoalId`.
- **Frontend today** (`app/components/goals/SubGoalsManager.vue:282-361`,
  `app/utils/subGoals.ts`): treats subgoals as their own resource keyed by `sSubGoalId`.
- **Backend recommendation:** keep the **URLs and the `sSubGoalId` field name exactly as
  specified** while implementing subgoals internally as `Goals` rows with `sParentGoalId`.
  Responses carry **both** `sGoalId` and `sSubGoalId` (same value), matching the dual-naming
  convention already used for tracking records.
- **Why:** avoids duplicating `recalculateGoalProgress()` (the ~140-line measurement engine that
  branches on 6 measurement types × 2 directions), plus `GoalTasks` (needed because subgoal
  payloads include `aTasks`) and `GoalFiles`. One engine means a fix applies to goals and
  subgoals at once.
- **Frontend impact:** **none.**

---

## Confirmed compatibility notes (no frontend action needed)

Recorded so nobody "fixes" these later:

1. **Subgoal list envelope must be `aData`.** `SubGoalsManager.vue:285` reads
   `oResponse.data.aData || oResponse.data.results || oResponse.data`, then calls `.map()` on the
   result at line 349. Returning this project's usual named key (`{ subGoals: [...] }`) would fall
   through to the raw response object and throw. **Backend will return `aData`** for
   `GET /goals/:sGoalId/subGoals` and `GET /subGoals/:sSubGoalId/trackingRecords` — a deliberate
   deviation from the `{ goals: [...] }` style used elsewhere. `aData` also happens to fit the
   Hungarian-notation convention better than the existing named keys.
2. **`/billing/summary` envelope must be `results`** (`pages/admin/billing/index.vue:138` reads
   `data?.results || data?.oData || data`), and `/billing/payment-methods` + `/billing/payments`
   must return **`aData`** (lines 152, 167).
3. **Login extras already wired.** `app/stores/auth.ts` declares `sAccountType?` and
   `sBillingStatus?`; `login.vue:105-106` reads them from `oResults.oSchool` with safe defaults
   (`'SCHOOL'` / `''`). Backend adding them to `oSchool` needs no frontend change.
4. **School tariff fields already sent.** `schools/[id]/edit.vue` posts/reads `sAccountType`,
   `sBillingMode`, `dFixedAmount`, `dAmountPerTeacher`, `dAmountPerStudent`, `dDiscountPct`
   with those exact names.
5. **Card data never reaches the backend.** `BillingCardForm.vue:123` gets a SetupIntent client
   secret and confirms with Stripe.js client-side, then posts only `sPaymentMethodId`. Correct —
   keeps the backend out of PCI scope.

---

## Resolved / already applied

*(entries move here once the frontend confirms the change is in)*
