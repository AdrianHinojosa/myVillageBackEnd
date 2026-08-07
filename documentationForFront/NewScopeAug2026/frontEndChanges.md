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
| 1 | 8 | `POST/PUT /trackingRecords`, record GETs, chart, PDF | **Many help types per record, each 0–10** — replaces the single `sHelpType` + `iHelpAmount` | 🔴 breaking |
| 2 | 10 | `POST /support/ticket` | None — contract matches as built | 🟢 none |
| 3 | 5 | `students/[id]/index.vue` | Skip `fetchIep()` in therapist mode — it now returns 403 | 🟡 tidy-up |
| 4 | 5 | `POST /schools`, `PUT /schools/:id`, login | None — `sAccountType` already wired correctly | 🟢 none |
| 5 | 5 | `RecordForm.vue` | **Hide the file-attach dropzone in therapist mode** — the upload endpoint now returns 403 | 🔴 breaking |

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

---

## Decided internals (recorded for transparency — no frontend action)

### P7 — Subgoal storage 🟢 *(APPROVED 2026-08-02 — frontend impact: none)*

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
