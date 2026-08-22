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

## 📋 AUDIT — 2026-08-18, frontend at `origin/dev` 98a9a91 (`adrianDev18Aug`, tree clean)

Every entry in this document was checked against the real frontend code, and **each verdict was then
re-checked by a second reviewer whose job was to refute it**. 45 findings, 11 verdicts changed by that
second pass — so read the *Verified* column, not the first one. Six items that looked DONE were
downgraded once a missed code path turned up.

### 🔴 Blocking — integration is visibly wrong until these land

| # | What is wrong | Where |
|---|---|---|
| 19 | **`bIsMainUser` is not used anywhere** — all four locations still gate on `sUserType === 'SchoolAdmin'`. This IS the unexplained 403 | `auth.ts`, `admin.vue:339`, `billing/index.vue:86`, `components/billing/*` |
| 16 | **The divided goal's % is still computed client-side by averaging the stages** — the rule the client rejected is still what the screen shows | `subGoals.ts` `getSubGoalsRollup()`, `SubGoalsManager.vue:529-536` |
| 18 | **The frontend has its own 3-record progress engine**, and it — not `oGoal.dProgress` — feeds the number and the progress-bar width. Any goal with >3 records disagrees with the API | `goals.ts:290,294,553,617`; rendered at `GoalDetail.vue:57,71` |
| 17 | **No re-fetch after `PUT /subGoals/:id { sStatus }`** — local state is patched instead, so the promoted stage and the goal's new % never appear | `[subGoalId].vue:412-418` |
| 11 | **No env file supplies the Stripe key**, and `NUXT_PUBLIC_BILLING_ENABLED` is unset, so the tariff payload is dropped entirely and no subscription can start | frontend `.env`, `nuxt.config.ts:33` |
| 9 | **The 402 handler bounces the user out of `/admin/billing`** — it redirects away from the one page they need in order to pay and un-suspend | `plugins/axios.ts:77-81` |
| — | **Reopening does not work at all**, for stages or goals: `reopen-goal` is declared in `emits` but never emitted, so both listeners are dead | `GoalDetail.vue:589` |

### 🟡 Important

| # | What is wrong |
|---|---|
| 12 | **503 (Stripe unconfigured) is not distinguished** from a real failure — it is swallowed or shown as a generic error |
| 9 | **No support button on the suspended screen**, though that is the documented way out |
| 1 | The student report view and PDF **lose help types for DIVIDED goals** — it fetches `/goals/:id/trackingRecords`, which is empty for a divided goal |
| 10 | Tariff field names are exact, but **the whole tariff payload is dropped** by the `billingEnabled` flag |
| 7 | Subgoal status UI: closing and pausing work, **reopening a closed stage does not** |
| 17 | **No `oCurrentStage` / `bCanCapture` derived from `sStatus === 'ACTIVE'`** — nothing stops a capture into a stage that is not in progress (the backend answers 409) |
| — | **A language switch silently wipes all 49 therapist terminology overrides** — found by the second reviewer; the first pass had this as DONE |

### 🟢 Verified done

P8 help types (capture payload, legacy field dropped, vocabulary matches the 8 backend codes) · P5
therapist mode (IEP skip, `sAccountType` wiring, file-attach hidden, goal-file upload hidden) ·
records on a divided goal carry `sSubGoalId` · `sStatus` no longer sent on subgoal create · all 8
`/billing/*` envelopes and field names · the report consumes `aRecords` as a plain array ·
`bHasSubGoals` payload is Joi-clean.

Partially done, and only in narrow cases: help-type chips render in lists, the chart colours by the
dominant help type and the PDFs print all of them — each with one path the first pass missed.

### 🧹 Cleanup worth doing

**`SubGoalsManager.vue`'s stage modal is dead code** — `bShowStage` is initialised `false` and only
ever re-assigned `false`; `oActiveStage` is initialised `null` and its only re-assignment is from
itself; `openStage()` navigates to the stage page instead of opening the modal. ~130 lines never
execute, including status controls and record capture. **The first version of the 18-Aug guide sent the
frontend team to edit exactly this file** — delete it or wire it, or it will happen again.

Full detail, with the fix for each: [`newFixesAug17/guia-frontend-submetas-secuenciales-18ago2026.md`](newFixesAug17/guia-frontend-submetas-secuenciales-18ago2026.md).

---

## Reference point

**Backend status: P10, P8, P5 and P7 are built, tested and pushed** to
`origin/features02Aug2026`. P3 (Stripe) is the only backend point outstanding — nothing in this
document depends on it. **You can start on these entries now.**

Frontend verified against **`origin/mainCopy` @ `d560e21`** ("Cobranza automática con Stripe (P3)").
Entries below were checked against **frontend source**, not only its docs — file and line references
point into that commit. Last reviewed 2026-08-07.

⚠️ *Note for whoever reads this next:* a local frontend clone goes stale fast. `git fetch` before
comparing — this backend was initially reading `21feafe` (31/mar) and wrongly concluded the
frontend work didn't exist.

---

## Summary table

| # | Punto | Endpoint / area | Change | Severity |
|---|---|---|---|---|
| 1 | 8 | `POST/PUT /trackingRecords`, record GETs, chart, PDF | **Many help types per record, each 0–10** — replaces the single `sHelpType` + `iHelpAmount` | 🔴 breaking |
| 2 | 10 | `POST /support/ticket` | None — contract matches as built | 🟢 none |
| 3 | 5 | `students/[id]/index.vue` | Skip `fetchIep()` in therapist mode — it now returns 403 | 🟡 tidy-up |
| 4 | 5 | `POST /schools`, `PUT /schools/:id`, login | None — `sAccountType` already wired correctly | 🟢 none |
| 5 | 5 | `RecordForm.vue` | **Hide the file-attach dropzone in therapist mode** — the upload endpoint now returns 403 | 🔴 breaking |
| 6 | 7 | `POST /trackingRecords` | Records on a **divided** goal must carry `sSubGoalId`; posting `sGoalId` for a divided goal now returns 409 | 🟡 adapt |
| 7 | 7 | `SubGoalsManager.vue` | **No UI exists to change a subgoal's status** — so subgoals can never close and the rollup is permanently 0/N | 🔴 gap |
| 8 | 7 | `POST /goals`, `PUT /goals/:id` | `bHasSubGoals` + `iTargetPercentage` now accepted — `POST /goals` previously **rejected** the frontend payload | 🟢 fixed backend-side |
| 9 | 3 | **Every school endpoint** | New **HTTP 402** when the school is `SUSPENDED` for non-payment — handle it like a block, not a generic error | 🟡 adapt |
| 10 | 3 | `POST/PUT /schools`, login | Tariff fields + `sBillingStatus` accepted/returned — already matches what the frontend sends | 🟢 none |
| 11 | 3 | **Environment** | Set `NUXT_PUBLIC_STRIPE_PK` to the publishable key, or card entry cannot work | 🔴 breaking |
| 12 | 3 | `/billing/*` | All 8 endpoints live and match the guide — no change needed | 🟢 none |
| 13 | 7 | `app/utils/subGoals.ts` → `getSubGoalsRollup()` | ~~Rollup rule mismatch~~ → **superseded by 16**: the goal no longer averages anything | 🔄 replaced |
| 14 | 7 | `GoalForm.vue:9` | ~~Title input hidden in subgoal mode~~ → ✅ **resolved** in `origin/dev` 98a9a91 | ✅ done |
| 15 | 7 | `GET /students/:id/report` | Divided goals now appear (they used to vanish) and each record carries `sSubGoalId` / `sSubGoalTitle` | 🟢 none |
| 16 | 7 | `subGoals.ts`, `SubGoalsManager.vue:529-536` | **The goal's % = its stage in progress, never an average.** Stop computing it client-side; read `oGoal.dProgress` | 🔴 breaking |
| 17 | 7 | `SubGoalsManager.vue` | **Subgoals are now SEQUENTIAL** — only one stage is `ACTIVE`, only that one accepts records (409 otherwise), and a status change moves OTHER rows so a re-fetch is mandatory | 🔴 breaking |
| 18 | 7 / all | Every goal percentage | The % now averages **all** records, not the last 3 — every existing number changes, in divided and ordinary goals alike | 🟡 adapt |
| 19 | 3 | login → `bIsMainUser` | **New field.** Gate the billing menu, the billing page and the card controls on it — that is what the unexplained **403** was | 🔴 breaking |

Severity: 🔴 breaking (integration fails without it) · 🟡 rename/adapt · 🟢 nice-to-have

---

## Pending changes

### 1. P8 — Help types are MANY per record, not one 🔴

**PO decision, 2026-08-02.** The frontend built one help type per record. The client's model —
confirmed against their mock-up ("¿Qué tipo de ayuda deseas otorgarle tu estudiante?" listing all
8 types with a value box each) — is **several types per record, each with its own 0–10 value**.

**What the frontend does today**

```ts
// app/utils/records.ts:88-92
if (oData.sHelpType) {
  oPayload.sHelpType   = oData.sHelpType;          // ONE slug: "visual"
  oPayload.iHelpAmount = oData.iHelpAmount || 0;   // ONE number
}
// app/utils/records.ts:35-36
sHelpType:   oRecord.sHelpType || '',
iHelpAmount: oRecord.iHelpAmount ?? null,
```

and `GUIA_BACKEND_AMPLIACION.md` §P8 states *"Un solo tipo por registro."*

**What it must do instead** — send and read an **array**:

```jsonc
// POST /trackingRecords  ·  PUT /trackingRecords/:sTrackingRecordId
{
  "dtDate": "2026-08-02",
  "iCorrect": 8, "iTotal": 10,
  "aHelpTypes": [
    { "sHelpType": "visual",  "iHelpAmount": 8 },
    { "sHelpType": "verbal",  "iHelpAmount": 7 },
    { "sHelpType": "escrita", "iHelpAmount": 6 }
  ]
}
```

- `sHelpType` — the frontend's existing lowercase slugs, unchanged
  (`independiente | ayuda_general | visual | verbal | escrita | gestual | modelacion | fisica`).
- `iHelpAmount` — integer **0–10** (PO-confirmed range).
- Omit a type entirely when it wasn't given. Do **not** send `iHelpAmount: null`.
- `aHelpTypes: []` or omitted = no help recorded.
- Sending the same `sHelpType` twice in one record is rejected (409).
- Every record GET returns `aHelpTypes` in the same shape.

**Frontend work**
| File | Change |
|---|---|
| `app/utils/records.ts` | `mapRecordToBackend` / `mapRecordFromBackend` — array instead of two scalars |
| `app/components/goals/RecordForm.vue` | capture UI: 8 rows, each with a 0–10 value, per the client mock-up |
| `app/components/goals/GoalSummary.vue` | `aChartJsDatasets` — point colour can no longer come from a single slug |
| `app/components/charts/BaseLineChart.vue` | per-point label likewise |
| `app/composables/useGoalChartCapture.ts` + PDF export | same |

**Chart colour rule — DECIDED (PO, 2026-08-02).** The signed PDF (p.4) says each point shows
*"un color distinto según el tipo de ayuda otorgado"* plus *"un número pequeño"* — one dot, one
colour, one number. With Visual 8 + Verbal 7 + Escrita 6 on one record that rule is undefined, so:

> **Colour the point by the help type with the highest `iHelpAmount`**, and use that number as the
> point label. Ties break by the canonical order of the 8 types in `helpTypes.ts`, so the result is
> deterministic. The full breakdown can go in the tooltip.

**No API change** — the backend returns the array; the frontend picks the maximum.

### 2. P10 — Support tickets: no change needed 🟢

`POST /support/ticket` is implemented exactly as `API_CONTRATO_TICKETS_SOPORTE.md` specifies.
`TicketModal.vue:136-146` works unmodified. For the record:
- Request: `{ sSubject (≤120, required), sMessage (≤1000, required), sCategory? }`.
  `sCategory` ∈ `technical | question | suggestion | other`, or omitted.
- Response: **200** `{ message, success: true }` — `message` is localized, so the axios
  interceptor displays it as designed.
- Errors: **409** validation (localized `message`) · 401 invalid/expired token · 404 reporter not found.
- **Reachable by SchoolAdmin, FACULTY *and* SuperAdmin** — the support button can stay visible
  for every user type, including superadmin. Also works for users of a **blocked** school (they
  can log in but nothing else works, so support must stay reachable).
- The body must contain **only** those three fields. The schema is strict: adding `sUserId`,
  `sSchoolId` or any other key returns 409. Identity comes from the token.

### 3. P5 — Skip the IEP fetch in therapist mode 🟡

- **File:** `app/pages/admin/students/[id]/index.vue` — `fetchStudent()` at line 335 calls
  `fetchIep()` unconditionally.
- **What happens now:** the backend enforces the contract's rule that a therapist account
  *"no podrá visualizar o utilizar el módulo de IEP"*, so `GET /iep` returns **403** for
  `THERAPIST` accounts.
- **Impact today: none visible.** The call is `silent: true` with an empty `.catch()`, so nothing
  is shown to the user. It's just a guaranteed-to-fail request in the network log.
- **Change:** guard the call, e.g. `if (!this.bIsTherapist) this.fetchIep();` — the page already
  has a `bIsTherapist` computed (line 270) used to hide the IEP tab.
- **Priority:** cosmetic. Nothing breaks if you skip it.

### 4. P5 — Therapist mode: everything else already matches 🟢

No change needed. Recorded so nobody re-checks:

- `POST /schools` and `PUT /schools/:sSchoolId` accept **`sAccountType`** (`SCHOOL` | `THERAPIST`)
  with exactly that name — `schools/[id]/edit.vue` and `add.vue` already send it. Invalid values
  return 409.
- **Omitting `sAccountType` on `PUT` preserves the current type** — it is never silently reset, so
  partial school edits are safe.
- `GET /schools/:sSchoolId` returns it.
- Login returns it at **`oResults.oSchool.sAccountType`**, exactly where `login.vue:105` reads it.
  `auth.ts` already declares `sAccountType?` on `IUser`. Superadmins have no `oSchool`, so they
  never enter therapist mode.
- **The backend now enforces the restrictions**, not just reports them. For `THERAPIST` accounts:
  `POST /schoolUsers`, `POST /iep`, `GET /iep` and `POST /goals/:sGoalId/goalFiles` all return
  **403** with a localized message. The frontend already hides all four, so this only matters if
  something calls them anyway.
- Not blocked: student photos, school logos, and **tracking-record file attachments** (see the
  open question below).

### 5. P5 — Hide the record file-attach control in therapist mode 🔴

**PO decision, 2026-08-07: therapists may NOT upload files.** The contract is explicit —
*"el terapeuta **no podrá cargar documentos** ni visualizar o utilizar el módulo de IEP"* — and that
covers tracking-record attachments, not only goal documents.

- **Backend now returns 403** on `POST /trackingRecords/:sTrackingRecordId/files` for `THERAPIST`
  accounts, with the localized message *"Esta función no está disponible en las cuentas de
  terapeuta."*
- **Frontend must hide the dropzone.** `RecordForm.vue` renders the attachment dropzone at
  ~line 208 with **no** therapist gating, so a therapist currently sees a control that will now
  fail. Gate it the same way `GoalForm.vue:311` gates the goal-documents section
  (`v-if="!bIsTherapist"`).
- Reading and deleting existing record files is **not** blocked — the restriction is on *uploading*.
  A therapist account that was previously a school account could still have files to view.

**Still allowed for therapists:** student photos (`POST /students/:id/image`) and the account logo
(`POST /schools/:id/image`). Those are profile pictures, not documents — a therapist legitimately
needs a patient photo and their own logo. Say the word if you want those blocked too; it is one
line each, but it would remove functionality the contract does not ask to remove.

### 6. P7 — Records on a divided goal must use `sSubGoalId` 🟡

**Business rule (signed PDF p.3):** *"Registros → submeta. La meta principal **no** tiene registros
propios cuando está dividida."* When a goal is split, the student's progress is tracked on the
stages, not on the container. If both accepted records, the parent's own progress and the subgoal
rollup would each count the same work and the student's advance would be double-reported.

**What the backend does now**

| Request | Result |
|---|---|
| `POST /trackingRecords` `{ sSubGoalId, … }` | ✅ 201 — record attaches to the subgoal |
| `POST /trackingRecords` `{ sGoalId, … }` on a **normal** goal | ✅ 201 — unchanged |
| `POST /trackingRecords` `{ sGoalId, … }` on a **divided** goal | ⛔ **409** *"Esta meta está dividida en submetas: los registros se capturan en la submeta, no en la meta principal."* |
| Both `sGoalId` and `sSubGoalId` | ⛔ 409 — exactly one is required |
| Neither | ⛔ 409 |

**Frontend impact: none for the current code.** `SubGoalsManager.vue:360` already posts
`{ sSubGoalId, ...oPayload }`, and the normal record form posts `sGoalId` on undivided goals. This
is registered so nobody later "fixes" the divided-goal path by sending `sGoalId`.

### 7. P7 — There is no way to change a subgoal's status 🔴 GAP

**Business rule (signed PDF p.3):** subgoals carry the same four states as goals —
*activa, completada, no alcanzada, pausada*. The frontend guide adds that the parent goal
*"se completa cuando TODAS las submetas están cerradas (completada / no alcanzada)"*, and the
rollup shows *"N/total etapas completadas"*.

**The gap.** `SubGoalsManager.vue` renders the status badge read-only (`GoalsGoalStatusBadges` at
~line 70) and offers only **view / edit / delete** per subgoal. `GoalForm.vue` — which is the
subgoal form — never sends `sStatus`. So **nothing in the UI can move a subgoal off `ACTIVE`.**

Consequences, all of them contract requirements that are currently unreachable:
- the rollup's *"N/total etapas completadas"* is permanently **0/N**
- `getSubGoalsRollup().bAllClosed` can never become true, so the parent can never auto-complete
- *pausada* and *no alcanzada* are unusable for subgoals

**The backend is ready** — no further backend work needed:
- `PUT /subGoals/:sSubGoalId` accepts `sStatus` ∈ `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED`
  (verified: setting `PAUSED` returns 200 and persists)
- it also accepts `tCompletedDate` and `sCompletionNotes` for closing a stage

**What the frontend needs:** a status control per subgoal — a dropdown on the card, or the same
complete/reopen dialog goals already use — issuing `PUT /subGoals/:sSubGoalId { sStatus }`.

### 8. P7 — `POST /goals` was rejecting the frontend's payload 🟢 fixed backend-side

`GoalForm.vue:739` sends `bHasSubGoals` on create (the *"¿Deseas dividir esta meta en submetas?"*
answer). `CreateGoalBody` is a strict schema, so the whole request failed with
`"bHasSubGoals" is not allowed` — **the divide-into-subgoals flow could not work at all.**

Now accepted on both `POST /goals` and `PUT /goals/:sGoalId`, together with `iTargetPercentage`
(in the signed PDF, previously missing from the schema entirely). `GET /goals/:sGoalId` returns
`bHasSubGoals`, which is what tells the frontend to show the subgoal manager instead of the normal
detail. **No frontend change required** — this entry exists so the fix is traceable.

### 9. P3 — HTTP 402 when a school is suspended for non-payment 🟡

**Business rule (signed PDF p.1-2):** once an account is marked delinquent its subscription is
suspended *"de manera inmediata, sin periodo de gracia, restringiendo el acceso a la plataforma
para **todos los usuarios** del colegio"*. Data is preserved; access returns automatically once a
charge succeeds.

**What the backend does now.** Every school endpoint returns **402 Payment Required** with a
localized message when `Schools.sBillingStatus = 'SUSPENDED'`:

> *"La suscripción de tu colegio está suspendida por falta de pago. Regulariza el pago para
> restaurar el acceso."*

**Which statuses block — only one:**

| Status | Access | Meaning |
|---|---|---|
| `NONE` | ✅ allowed | never billed — **every school that exists today** |
| `TRIALING` | ✅ allowed | inside the 30-day free trial |
| `ACTIVE` | ✅ allowed | paid up |
| `PAST_DUE` | ✅ allowed | a charge failed, retries still running — warn, don't lock out |
| `CANCELED` | ✅ allowed | cancelled but paid until the cut-off date |
| **`SUSPENDED`** | ⛔ **402** | retries exhausted |

**Frontend impact.** The frontend already gates at login by reading
`oResults.oSchool.sBillingStatus` and redirecting to `/admin/suspended`, which is the primary
mechanism. The 402 is defence in depth for a session that was already open when suspension
happened. Two things worth doing:

1. Treat **402** as "suspended" in the axios interceptor — redirect to `/admin/suspended` rather
   than showing a generic error toast.
2. **Support tickets keep working while suspended** (`POST /support/ticket` still returns 200), so
   leave the support button reachable on the suspended screen — that is deliberately the one way
   out for a locked-out school.

### 10. P3 — Tariff fields and billing status: already compatible 🟢

No change needed. Recorded so nobody re-checks:

- `POST /schools` and `PUT /schools/:sSchoolId` accept `sBillingMode` (`FIXED` | `VARIABLE`),
  `dFixedAmount`, `dAmountPerTeacher`, `dAmountPerStudent`, `dDiscountPct` — exactly the names
  `schools/[id]/edit.vue` already sends.
- **Omitting them on `PUT` preserves the stored tariff**, so partial school edits are safe.
- Invalid values return **409** with a localized message (`sBillingMode: 'MONTHLY'` and
  `dDiscountPct: 150` both verified).
- `GET /schools/:sSchoolId` returns the tariff **and** `sBillingStatus` for the superadmin chip.
- Login returns `oSchool.sBillingStatus`, where `auth.ts` already declares it.
- **The backend's `dMonthlyTotal` is the official amount.** Its formula is a deliberate mirror of
  your `computeMonthlyTotal()` in `app/utils/billing.ts` — same discount clamping, same rounding,
  and VARIABLE computed on `iUsersLimit`/`iStudentsLimit`, never the real user count. Verified
  identical: 500×10 + 200×40 − 10% = **11,700**. Keep using yours for the preview.

### 11. P3 — Set `NUXT_PUBLIC_STRIPE_PK` 🔴

Card entry runs entirely in the browser through Stripe.js, so the **publishable** key must be in the
frontend environment. `nuxt.config.ts` already wires
`runtimeConfig.public.stripePublishableKey`; it just needs a value.

```
NUXT_PUBLIC_STRIPE_PK=pk_test_...        # ask the backend team, or read it from .env
```

Without it, `stripe.confirmCardSetup()` cannot initialise and `BillingCardForm.vue` shows its
placeholder state — the rest of the billing panel still works, since summary, history and cancel
need no Stripe.js.

⚠️ **Test and live keys differ.** The current value is `pk_test_…`. Going live needs the `pk_live_…`
one, swapped at the same time as the backend's secret key.

### 12. P3 — Billing endpoints: all live, no change needed 🟢

Implemented exactly as `GUIA_BACKEND_AMPLIACION.md` §P3 specifies. Recorded so nobody re-checks:

| Endpoint | Envelope | Note |
|---|---|---|
| `GET /billing/summary` | **`results`** | matches `data?.results \|\| data?.oData \|\| data` at `index.vue:138` |
| `GET /billing/payment-methods` | **`aData`** | `{ sPaymentMethodId, sBrand, sLast4, iExpMonth, iExpYear, bDefault }` |
| `GET /billing/payments` | **`aData`** | `{ sPaymentId, dAmount, sCurrency, tPaidAt, sStatus, sCardBrand, sLast4, sStripeTransactionId }` |
| `POST /billing/setup-intent` | `sClientSecret` | |
| `POST /billing/payment-methods` | `message` | body `{ sPaymentMethodId }` |
| `PUT /billing/payment-methods/:id/default` | `message` | |
| `DELETE /billing/payment-methods/:id` | `message` | |
| `POST /billing/cancel` | `message` | |

`sStatus` on a payment is lowercase — `succeeded` / `failed` / `pending` — matching your `IPayment`
type. `dMonthlyTotal` in the summary is the **official** amount; keep using your
`computeMonthlyTotal()` for the preview, they agree exactly.

**Three behaviours worth knowing:**

1. **Only the school's main user can mutate.** Adding, switching or removing a card, and cancelling,
   all return **403** for any other user. Your page already restricts itself to SchoolAdmin; this is
   the server-side equivalent. FACULTY cannot reach `/billing/*` at all.
2. **Deleting the only card is refused with 409** while the subscription is live — it would
   guarantee the next renewal fails and suspend the school. Show the message; the way out is Cancel.
3. **`503` means billing is unconfigured on the server** (no Stripe key), not a user error. Worth
   distinguishing in the UI from a real failure.

---

### 16, 17, 18. P7 — Sequential stages + new average window 🔴

*(Client decision, Lucy, 2026-08-18. **The full guide is
[`newFixesAug17/guia-frontend-submetas-secuenciales-18ago2026.md`](newFixesAug17/guia-frontend-submetas-secuenciales-18ago2026.md)**
— it lists every file and line to touch, with snippets. Summarised here so the table is not
misleading.)*

Two business rules were corrected by the client, and they replace entry 13 entirely:

1. **A goal's % averages ALL its records**, not the last 3. Applies to goals and subgoals alike.
2. **A divided goal's % IS its stage in progress.** It averages nothing. With no stage in progress it
   shows the last closed stage; with nothing started, 0.

Rule 2 only has one answer if only one stage can be in progress, so the backend now enforces the
**sequential machine** the signed PDF originally described: at most one subgoal is `ACTIVE`, new ones
queue as `PAUSED`, closing one promotes the next automatically.

**Minimum the frontend must change** (details and snippets in the guide):

| | |
|---|---|
| 🔴 | `dOverallProgress` → `Number(this.oGoal.dProgress)`. Strip `dProgress` out of `getSubGoalsRollup()`; keep it only for `iCompleted / iTotal` and `bAllClosed` |
| 🔴 | "the stage in progress" = `aSubGoals.find(o => o.sStatus === 'ACTIVE')`, **not** the card the user opened. Only that stage accepts records — the rest return **409** |
| 🔴 | After `PUT /subGoals/:id { sStatus }`, drop the local patch at `SubGoalsManager.vue:741` and re-fetch the stages **and** the goal — the backend moved other rows |
| 🟡 | Stop sending `sStatus` on `POST /goals/:id/subGoals` (it is stripped; the machine assigns it) |
| 🟡 | Label the list as a queue: **en curso / en espera / completada / no alcanzada** |
| 🟡 | Explain the **0%** right after closing a stage — it is correct, confirmed with the client, but looks like a bug without context |
| 🟡 | Update `docs/REGLAS_DE_NEGOCIO.md` §7.4 and §13.2 — they still document "últimos 3 registros" |

**Heads-up on rule 1:** every existing percentage changes, not only in divided goals. A goal that
went 10% → 90% used to read 90% (the recent three) and now reads the average of its whole history.
`development` was already recomputed by migration `3039`; e.g. the goal "Organización" went from
91.67% to 75%. Marking a record as **excluded** is now the only way to keep an outlier out.

---

### 19. P3 — Login now returns `bIsMainUser` 🔴

*(Added 2026-08-18 while diagnosing the reported 401s and 403s on `/billing/*`.)*

The contract limits card and subscription management to *"el usuario principal del colegio"*, and the
backend has always enforced it with a **403**. But the login payload only said
`sUserType: 'SchoolAdmin' | 'FACULTY' | 'SuperAdmin'` — there was **no way for the frontend to tell a
main user from a secondary one**. So the billing page and every card button were shown to any
SchoolAdmin, and the secondary ones hit a 403 with no explanation. That is the 403 that was reported.

**Backend fix (already in):** `results.bIsMainUser` — `true` only for the account created together
with the school (`Users.sCreatedBy IS NULL`), always `false` for a SuperAdmin.

**What to change:**

```js
// app/stores/auth.ts
bIsMainUser?: boolean;
bCanManageBilling: (state) => state.oUser?.sUserType === 'SchoolAdmin' && state.oUser?.bIsMainUser === true,
```

| Where | Change |
|---|---|
| `app/layouts/admin.vue:339` | the `/admin/billing` entry needs `bIsMainUser`, not just `aAllowedUserTypes: ['SchoolAdmin']` |
| `app/pages/admin/billing/index.vue:86` | same in `definePageMeta` |
| `BillingCardForm`, `BillingCardList` | hide add / set-default / delete card and cancel subscription when `bIsMainUser` is false |

**Reads stay open to any school admin** — summary, payment history and the card list all return 200
for them; only the mutations are restricted. Verified against the running app, all 8 endpoints:

| Endpoint group | Main user | Other school admin | FACULTY | SuperAdmin | No token |
|---|---|---|---|---|---|
| reads (`summary`, `payments`, `payment-methods`) | 200 | 200 | 403 | 401 | 401 |
| mutations (`setup-intent`, card CRUD, `cancel`) | 200 | **403** | 403 | 401 | 401 |

The **401** column is not a bug either: `/billing/*` are school routes, so a platform-superadmin token
has no school-user session. Same for a missing or expired `Authorization` header.

---

### 13. ~~P7 — The rollup rule differs from `getSubGoalsRollup()`~~ 🔄 SUPERSEDED BY 16

> Kept for the record. The rule described below (average of all subgoals, empty counting as 0) was
> the PO's decision of 2026-08-14 and was **replaced on 2026-08-18** by the client: the goal mirrors
> its stage in progress and averages nothing. Do not implement what follows.

*(From Lucy's feedback, 2026-08-17. Full context in
[`newFixesAug17/respuesta-backend-17ago2026.md`](newFixesAug17/respuesta-backend-17ago2026.md).)*

A divided goal's `dProgress` is now **aggregated from its subgoals** and stored on the goal itself,
so `GET /goals/:id`, `GET /goals/student/:id`, the report and `/schools/analytics` all show it
without any frontend change. **But the two sides compute it differently:**

| | Rule | Etapa 1 = 90%, Etapa 2 with no records |
|---|---|---|
| **Backend** (PO decision 2026-08-14) | average of **ALL** active subgoals, an empty one counts as **0** | **45%** |
| **Frontend** `app/utils/subGoals.ts` → `getSubGoalsRollup()` | average of subgoals with **≥1 record**, 0 if none started | 90% |

They agree whenever every stage has at least one record — which is the case for all three divided
goals currently in dev — so this is not urgent, but the subgoal manager will contradict the goal card
the moment a stage is created and left empty.

**What to change:** make `getSubGoalsRollup()` average every active subgoal, counting one with no
records as 0. Or, better, just display `oGoal.dProgress` from the API and delete the client-side
calculation — one source of truth.

**If you disagree with the rule**, say so and the backend flips to started-only: it is one condition
in `recalculateParentRollup()` plus re-running the backfill migration. What must not happen is the
two staying different.

---

### 14. P7 — The subgoal title input is hidden ✅ RESOLVED

*(From Lucy's feedback, 2026-08-17. **Fixed in `origin/dev` 98a9a91**: `GoalForm.vue:11-14` now
renders the field in subgoal mode with `:b-required="!bIsSubGoal"`. Nothing left to do; the backend
rules below are kept because they explain the blank-title fallbacks.)*

**Business rule:** *"quiere ponerle un título a cada submeta (hoy solo dice 'Etapa 1')"*. Backend now
**accepts and persists** `sTitle` on `POST /goals/:sGoalId/subGoals` and `PUT /subGoals/:sSubGoalId`,
and returns each subgoal's own title from `GET /goals/:sGoalId/subGoals`.

**What to change:** `GoalForm.vue:9` still hides the title field with `v-if="!bIsSubGoal"`, so in
subgoal mode the form sends `sTitle: ''`. Show the input for subgoals and the feature works.

**Backwards compatible on purpose** — nothing breaks while that ships:

| Sent | Result |
|---|---|
| `sTitle` with content, on create | saved as the subgoal's own title |
| `sTitle: ''` or absent, on create | **inherits the parent's title** (today's behaviour) |
| `sTitle` with content, on update | replaces the stored title |
| `sTitle: ''`, on update | **leaves the stored title alone** — never blanks it |

`sMeasurementType` stays inherited and immutable: every stage of a goal measures the same thing.

---

### 15. P7 — Subgoal records now reach the student report 🟢

*(From Lucy's feedback, 2026-08-17. No frontend change required.)*

`GET /students/:sStudentId/report` used to look for records under the top-level goal ids only. A
divided goal's records carry the **subgoal's** id, so none were found — and because the report keeps
only goals that have records, **the divided goal disappeared from the report entirely** (not 0%,
absent).

Now the report also queries the subgoals' records and attributes each one to its parent goal, so it
lands in that goal's `aRecords`. Two extra fields per record, both `null` for a normal goal's
records:

| Field | Meaning |
|---|---|
| `sSubGoalId` | the stage that produced the record |
| `sSubGoalTitle` | that stage's title |

`sGoalId` still points at the row's real owner (the subgoal) rather than being rewritten to the
parent — grouping happens in the response, not by falsifying the field. `aRecords` is consumed as a
plain array by `useReportPdfGenerator`, so nothing needs to change; the two new fields are there if
the PDF wants to label each row with its stage.

---

## Decided internals (recorded for transparency — no frontend action)

### P7 — Subgoal storage 🟢 *(APPROVED 2026-08-02, BUILT 2026-08-07 — frontend impact: none)*

**Response shape, for reference.** Every subgoal carries both ids, mirroring `ISubGoal`:

```jsonc
{
  "sSubGoalId": "…",   // the subgoal itself  (what you key off, PUT/DELETE with)
  "sGoalId":    "…",   // the PARENT goal it belongs to
  "sTitle":            "inherited from the parent, always",
  "sMeasurementType":  "inherited from the parent, immutable",
  "sStatus": "ACTIVE", "iOrder": 0,
  "dProgress": 80, "dAverageValue": 80, "iRecordsCount": 1, "tLastRecord": "…",
  "aGoalTasks": [ ]
}
```
Anything you send as `sTitle`, `sMeasurementType`, `bHasSubGoals` or `aDocuments` on a subgoal is
**accepted and ignored** — the first two are inherited, a subgoal cannot itself be divided, and
documents go through the existing `goalFiles` upload endpoint. That is deliberate, so reusing
`GoalForm.vue` never triggers a validation error.


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

## Feature 1 — Pago por transferencia (contrato, ya implementado en el frontend)

El frontend (branch `dev` de `myVillage`) ya envía/lee estos nombres exactos; se listan para
referencia y para el equipo de backend:

1. **Colegio (`POST /schools`, `PUT /schools/:id`)** — nuevos campos, todos opcionales:
   - `sPaymentMethod`: `'STRIPE' | 'TRANSFER'` (default `'TRANSFER'`).
   - `dMonthlyAmount`: número (monto mensual, solo en TRANSFER).
   - `tNextPaymentDate`: fecha `YYYY-MM-DD` (primera fecha de vencimiento; el front la manda como `tNextPaymentDate`, ya con el mapeo `dt→t`).
2. **`GET /billing/summary`** (envelope `results`) — ahora incluye `sPaymentMethod`, `dMonthlyAmount`,
   `tNextPaymentDate`. En modo TRANSFER el frontend muestra una tarjeta manual (Estado Pagado/Pendiente
   derivado de `tNextPaymentDate` vs hoy, Monto, Próximo pago) en vez de la UI de Stripe.
3. **`GET /schools/:id`** — devuelve `sPaymentMethod`, `dMonthlyAmount`, `tNextPaymentDate` (ya vienen
   con `select *`). El detalle del colegio (superadmin) muestra la tarjeta con botón "Registrar pago".
4. **Nuevo endpoint `POST /schools/:id/billing/registerTransferPayment`** (superadmin) — sin body;
   avanza el ciclo +1 mes y responde con `{ message, school, success }`. El front lo llama desde el
   detalle del colegio.
5. **Flag de frontend** `TRANSFER_BILLING_ENABLED` (`app/utils/features.ts`): ON en `dev`, OFF en
   `main` hasta que backend despliegue estos campos. Al desplegar backend, prender en prod.

---

## Resolved / already applied

*(entries move here once the frontend confirms the change is in)*
