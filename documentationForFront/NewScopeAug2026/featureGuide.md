# Feature Guide — Ampliación de alcance (Aug 2026)

**For:** the frontend team, QA, and anyone picking this up later
**Backend branch:** `features02Aug2026`
**Last updated:** 2026-08-07

Plain-language explanation of **how each feature actually works on the backend**: what was stored,
where, which endpoints exist, and what the frontend gets back. No backend knowledge assumed.

> **Sibling documents**
> - [`implementationTracket.md`](implementationTracket.md) — build status, engineering decisions, open questions
> - [`frontEndChanges.md`](frontEndChanges.md) — the list of things the **frontend** must change
> - This file — *what each feature is and how to use it*

---

## How to read the endpoint tables

Every URL below is written the way the frontend calls it (`/support/ticket`). The real URL has a
prefix the axios base already adds:

```
{env}/api/v1/{sLang}/{module}/...
   ↓
/development/api/v1/sp/support/ticket
```

`sLang` is `sp` (Spanish) or `en` — it decides the language of the `message` field that the axios
interceptor pops up on screen. **Every endpoint returns a `message`**, already translated; the
frontend never hardcodes those strings.

Authentication is always the `Authorization: Bearer <token>` header. **The backend never accepts
your user id, school id, or role in the request body** — it reads them from the token. Sending
them is rejected.

**Validation failures return HTTP `409`**, not 400 — that is this project's existing convention.
The `message` is always localized and explains what was wrong, so the axios interceptor shows
something useful without the frontend inspecting the error.

---

# Status at a glance

| # | Feature | Backend state | New table? | New endpoints |
|---|---|---|---|---|
| 10 | Support tickets | ✅ **Built** | No | 1 |
| 8 | Help types | ✅ **Built** | Yes — `TrackingRecordHelps` | 0 (extends existing 3) |
| 5 | Therapist mode | ✅ **Built** | No — 1 new column on `Schools` | 0 (extends existing) + 4 gated |
| 7 | Subgoals | ⬜ Not started | No — `Goals` gains a parent link | 6 |
| 3 | Billing (Stripe) | ⬜ Not started | Yes — `Payments` + columns on `Schools` | ~8 + webhook |
| 11 | Goal-writing guide | ➖ Frontend only | — | — |
| 13 | Trainings module | ➖ Frontend only | — | — |

---

# ✅ Punto 10 — Support tickets

### What it does, in one paragraph

Any logged-in person can open the support form, type a subject and a description, optionally pick
a category, and send it. The backend figures out **who they are from their login token**, looks up
their name, email, phone and school, and emails all of that to the support inbox. The person gets
back a friendly confirmation message in their own language. Nothing is saved in the database — the
signed contract explicitly says this stage is "only sending the notification email".

### Was a table created?

**No.** This was deliberate: the contract says there is no ticket panel and no ticket history at
this stage (that would be a separate proposal). Adding a table nobody reads would be dead weight.
If history is bought later, a `SupportTickets` table can be added without changing this endpoint.

### The endpoint

| | |
|---|---|
| **URL** | `POST /support/ticket` |
| **Who can call it** | **Anyone logged in** — school admin, teacher (FACULTY), *and* superadmin |
| **Success** | `200` |

**What you send**

```jsonc
{
  "sSubject":  "No puedo generar el PDF de reporte",   // required, max 120 characters
  "sMessage":  "Al dar clic en Exportar no pasa nada", // required, max 1000 characters
  "sCategory": "technical"                             // optional — may be omitted entirely
}
```

`sCategory` must be one of `technical`, `question`, `suggestion`, `other` — or left out.

**What you get back**

```jsonc
{
  "message": "Tu reporte fue enviado. Te contactaremos pronto.",
  "success": true
}
```

The axios interceptor displays `message` automatically, so the modal only needs to close and reset.

**When things go wrong**

| Code | Meaning |
|---|---|
| `409` | A field is missing, too long, an invalid category, **or you sent an extra field**. `message` explains which, already localized. |
| `401` | Token missing, invalid, or expired |
| `404` | The user behind the token could not be found |

### Three behaviours worth knowing

**1. Superadmins can file tickets.** This needed real work. School users and superadmins log in
through two completely separate doors in this system — different tables, different session checks.
No existing security gate accepted both. A new one (`verifyAnyAuthenticatedUser`) tries the school
door first, then the admin door. Practical upshot: **the support button can stay visible for every
user type.**

**2. A school that has been blocked can still send a ticket.** Deliberate. A blocked school can
log in, but every other endpoint returns 404 — so if support were blocked too, they'd have no way
to reach anyone precisely when they most need to. A valid session is still required.

**3. Identity cannot be faked.** Name, email, phone, school and role are read from the token. The
request schema is strict, so a body containing `sUserId` or `sSchoolId` is rejected outright.

### What the support inbox receives

An HTML email in the My Village house style (logo, rainbow divider, teal button), containing:

- subject, category chip, and the full message
- **who reported it:** name, email (clickable "Reply to user" button), phone, role
  (*Superadministrador* / *Docente* / *Administrador de colegio*), and school name
- the interface language they were using, so support replies in the right one
- a small technical footer with the user and school ids

Destination is `info@myvillage.com.mx` (overridable with the `SUPPORT_EMAIL` env var).

### SMS — enabled

Alongside the email, an SMS heads-up goes out through AWS SNS to **+528181377416**, on every
ticket regardless of category. It fires only when both `SUPPORT_SMS_ENABLED=true` and
`SUPPORT_PHONE` are set, so any environment missing them simply sends no SMS.

Two things to know:

- **The SNS service had never actually worked.** `SMS.services.ts` existed but nothing imported it,
  and it built its AWS client *before* loading the credentials — so every send would have failed
  silently. Fixed when this was switched on.
- ⚠️ **AWS SNS accounts start in a sandbox** that can only reach *verified* phone numbers. If
  `+528181377416` isn't verified in the SNS console, sends fail silently (the path is
  fire-and-forget, exactly like email). Verify it there before relying on it.

### ⚠️ One honest limitation

The email system is "fire and forget" — it hands the message to AWS and never checks the result.
If AWS rejects it, the error is only written to the server log. **So the success message means
"we received your report", not "the email arrived".** Changing this would affect every email the
platform sends, so it wasn't done unilaterally — flagged for a decision.

---

# ✅ Punto 8 — Help types

> ⚠️ This **differs from what the frontend currently has** — it sends one help type per record.
> Read [`frontEndChanges.md`](frontEndChanges.md) entry 1. A compatibility shim keeps the old
> format working meanwhile, so nothing breaks on deploy.

### What it does, in one paragraph

When a teacher logs a session result, they can also record **what kinds of support the student
needed** and **how much of each**, on a 0–10 scale — for example Visual 8, Verbal 7, Written 6.
This is purely descriptive, like a note: it **never** changes the goal's progress, average, or
record count. On the chart, each point is coloured by the support type with the highest value.

### The important change from what the frontend built

The frontend currently sends **one** support type per record (`sHelpType` + `iHelpAmount`). The
client's model — confirmed from their mock-up, which lists all 8 types each with its own value box
— is **several types per record, each with its own number**. That is what the backend now stores.

### Was a table created?

**Yes — `TrackingRecordHelps`.** Because one record can now hold several help types, they can't
live in a column on the record itself. The alternative (eight fixed columns, one per type) would
be rigid and painful to query for reports.

| Column | Type | Meaning |
|---|---|---|
| `sTrackingRecordHelpId` | uuid | primary key |
| `sTrackingRecordId` | uuid | which tracking record this belongs to |
| `sHelpType` | string | the support type code |
| `iHelpAmount` | integer | how much, **0–10** |

One row per help type per record. The same type cannot be recorded twice on one record.

### Why not the column that was already there?

`TrackingRecords` has an unused `sSupportUsed` column, added long ago and documented with exactly
these 8 types. It holds a *single* value, so it can't serve the multi-type model. It will be left
untouched (dropping a production column is not something to do casually) and marked as superseded.

### The 8 support types

The frontend keeps its own lowercase slugs on the wire; the database stores the uppercase code
already established for this concept — the same style as `sStatus`, `sMeasurementType`,
`sDirection`. **The frontend never sees the uppercase form**; translation happens at the boundary.

| Frontend sends | Stored as | Label (ES) |
|---|---|---|
| `independiente` | `INDEPENDENT` | Independiente |
| `ayuda_general` | `GENERAL` | Ayuda General |
| `visual` | `VISUAL` | Visual |
| `verbal` | `VERBAL` | Verbal |
| `escrita` | `WRITTEN` | Escrita |
| `gestual` | `GESTURAL` | Gestual |
| `modelacion` | `MODELING` | Modelación |
| `fisica` | `PHYSICAL` | Física |

### No new endpoints — the existing record endpoints grow a field

| URL | Change |
|---|---|
| `POST /trackingRecords` | accepts `aHelpTypes` |
| `PUT /trackingRecords/:sTrackingRecordId` | accepts `aHelpTypes` (**replaces** the whole set) |
| `GET /goals/:sGoalId/trackingRecords` | returns `aHelpTypes` on each record |

**What you send**

```jsonc
{
  "dtDate": "2026-08-02",
  "iCorrect": 8,
  "iTotal": 10,
  "aHelpTypes": [
    { "sHelpType": "visual",  "iHelpAmount": 8 },
    { "sHelpType": "verbal",  "iHelpAmount": 7 },
    { "sHelpType": "escrita", "iHelpAmount": 6 }
  ]
}
```

- Leave a type **out entirely** if it wasn't given — don't send it with a null.
- Repeating the same `sHelpType` twice returns **409** with a clear message.
- `iHelpAmount` must be a whole number 0–10. `11`, `-1` and `2.5` are all rejected with 409.
- All 8 types at once is allowed. A 9th entry is rejected.
- **On `POST`:** omitting `aHelpTypes` stores nothing; the response returns `aHelpTypes: []`.
- **On `PUT`:** sending the array **replaces** the whole stored set. Sending `[]` **clears** it.
  **Omitting the field leaves the existing set untouched** — so partial edits are safe.

**What you get back** — the same shape, on every record in every GET.

### It does not affect any calculation

The contract insists on this, so it was tested rather than assumed. Progress, average, record
count and the "last 3 records" rule read only the measurement fields (`iHits`, `iScaleValue`,
`iOccurrences`, …). Help types sit alongside and are never consulted.

Proven on a real `EXACTITUD` goal:

| Step | `dProgress` | `dAverageValue` |
|---|---|---|
| record 9/10 correct, **no** help types | 70.00 | 70.00 |
| **added 4 help types, all at 10** | 70.00 | 70.00 |
| **cleared all help types** | 70.00 | 70.00 |
| *sanity:* changed the measurement 9/10 → 2/10 | **35.00** | — |

The last row matters: it proves the check can actually detect movement, so the three unchanged
rows above are real evidence and not a test that simply never moves.

### Chart colouring (frontend side)

A record with Visual 8, Verbal 7 and Written 6 has no single "the" support type, so the contract's
"one colour per point" rule needed a tiebreak. **Decision: colour the point by the type with the
highest value**, and show that number as the point label; ties fall back to the canonical order of
the 8 types so it's deterministic. The full breakdown can go in the tooltip. **No API change** —
the backend returns the array and the frontend picks the maximum.

### Backwards compatibility during the transition

So the frontend isn't broken the moment the backend deploys, `POST`/`PUT` **also** accept the old
single-value form (`sHelpType` + `iHelpAmount`) and store it as a one-item array — verified:
sending `sHelpType: "modelacion", iHelpAmount: 4` comes back as
`aHelpTypes: [{ sHelpType: "modelacion", iHelpAmount: 4 }]` and is stored as `MODELING`. The 0–10
range applies to the legacy field too.

This is a **temporary shim**, marked in the code for removal once the frontend ships the new
capture UI.

### How it was verified

39 checks against the real development database with a genuine session token: multi-type create,
UPPERCASE storage with lowercase wire slugs, ordering by amount, all six validation rejections
(duplicate, 11, −1, 2.5, unknown type, 9 items), 0 and all-8 accepted, the legacy shim, `PUT`
replace / preserve / clear, the batched list read, and the calculation-invariance proof above.
Every test record was removed afterwards and the affected goals' counters recomputed — leftover
help rows: 0, goal counter drift: 0.

---

# ✅ Punto 5 — Therapist mode

### What it does, in one paragraph

An account is now either a **school** (everything as before) or a **therapist**. The superadmin
picks which when creating or editing the account. When someone logs in, the backend tells the
front-end which type it is, and the front-end reworks all its wording — "colegio" becomes
"terapeuta", "alumnos" become "Pacientes", "Docente" becomes "Terapeuta". On top of that, the
backend now **actively refuses** the three things a therapist account isn't allowed to do, so the
restriction is real rather than just hidden in the interface.

### Was a table created?

**No — one new column** on the existing `Schools` table.

| Column | Values | Default |
|---|---|---|
| `sAccountType` | `SCHOOL` or `THERAPIST` | `SCHOOL` |

Every existing school was automatically set to `SCHOOL`, so nothing about current behaviour
changed. Verified after the migration: all 12 accounts in the development database came out as
`SCHOOL`.

### How an account becomes a therapist account

The superadmin sets it, on the endpoints that already exist:

| URL | Change |
|---|---|
| `POST /schools` | accepts `sAccountType` — omit it and you get `SCHOOL` |
| `PUT /schools/:sSchoolId` | accepts `sAccountType` — **omit it and the current type is kept**, it is never silently reset |
| `GET /schools/:sSchoolId` | returns `sAccountType` |

Sending anything other than `SCHOOL` or `THERAPIST` is rejected with **409** and a localized message.

### Login tells the front-end which mode to use

`sAccountType` now travels inside `oSchool`, exactly where the front-end already looks
(`oResults.oSchool.sAccountType`):

```jsonc
{
  "message": "Bienvenido, …",
  "status": true,
  "results": {
    "sUserId": "…", "sToken": "…", "sUserType": "SchoolAdmin",
    "oSchool": {
      "sSchoolId": "…",
      "sSchoolName": "Consultorio Ana López",
      "sSchoolLogo": "…",
      "oImages": { },
      "sAccountType": "THERAPIST"      // ← new
    },
    "aPermissions": [ ]
  }
}
```

Superadmins have no school, so they have no `oSchool` and never see therapist mode.

### What a therapist account is refused

The contract says a therapist *"operará como un usuario único, por lo que no contará con la
posibilidad de crear usuarios adicionales"* and *"no podrá cargar documentos ni visualizar o
utilizar el módulo de IEP"*. All three are now enforced server-side:

| URL | Result for a therapist account | Why |
|---|---|---|
| `POST /schoolUsers` | **403** | single user — cannot create more |
| `POST /iep` | **403** | cannot *use* the IEP module |
| `GET /iep` | **403** | cannot *view* it either |
| `POST /goals/:sGoalId/goalFiles` | **403** | cannot upload documents |

The message is localized: *"Esta función no está disponible en las cuentas de terapeuta."* /
*"This feature is not available on therapist accounts."*

**Everything else works normally** — students, goals, tracking records, reports, support tickets.
Verified: a therapist account still gets `201` on `GET /students` and `200` on
`POST /support/ticket`.

### Two things deliberately *not* blocked

1. **Attaching files to a tracking record** (`POST /trackingRecords/:id/files`). The contract's
   "cannot upload documents" arguably covers these, but `RecordForm.vue` has **no** therapist
   gating — the button is still visible to therapists, so blocking it server-side would make a
   working button fail. Raised as a question rather than silently breaking it.
2. **Student photos and school logos** (`POST /students/:id/image`, `POST /schools/:id/image`).
   Those are pictures, not documents, and a therapist still needs an avatar and a logo.

### One thing the front-end should tidy up

The student detail page calls `fetchIep()` **unconditionally**, including for therapists
([`students/[id]/index.vue:335`](../../../myVillage/app/pages/admin/students/[id]/index.vue#L335)).
That call now returns `403`. It's harmless — the request is `silent: true` with an empty
`.catch()`, so nothing appears on screen — but it's a pointless failing request in the console.
Skip it when in therapist mode.

### How it was verified

Against the real development database, with a genuine session token:

- migration applied; all 12 existing schools defaulted to `SCHOOL`
- as `SCHOOL`: none of the four endpoints blocked
- as `THERAPIST`: all four return `403` with the localized message
- as `THERAPIST`: `GET /students` and `POST /support/ticket` still succeed
- login returns `sAccountType` correctly for both types
- invalid values rejected; omitting the field on `PUT` preserves the existing type
- test data restored afterwards (all accounts back to `SCHOOL`, password restored, sessions removed)

# ⬜ Punto 7 — Subgoals *(not started)*

Planned: a goal can be split into up to 5 subgoals. Internally a subgoal will be a **`Goals` row
with a parent link**, not a separate table — that way it automatically reuses the existing progress
engine, tasks, files and records instead of duplicating them. **The frontend contract is unchanged**:
the URLs stay `/goals/:id/subGoals` and `/subGoals/:id`, and the id field stays `sSubGoalId`.
Six endpoints. Documented here once built.

# ⬜ Punto 3 — Billing with Stripe *(not started)*

Planned: billing columns on `Schools`, a `Payments` history table, card management through Stripe
(card numbers never touch our servers), monthly recurring charges, failure retries, and account
suspension. Roughly 8 endpoints plus a Stripe webhook. Documented here once built.

---

## ⚠️ Outstanding items — deliberately not done

Everything here was a conscious choice, not an oversight. Each row says **who owns it** and
**what happens if it's ignored**. Nothing here blocks the features already shipped.

### Needs a decision (blocks nobody today)

| # | Item | Owner | If ignored |
|---|---|---|---|
| **Q15** | **May therapists attach files to tracking records?** The contract says therapists cannot *"cargar documentos"*. Goal documents are blocked; record attachments are **not**, because `RecordForm.vue` has no therapist gating and blocking would make a visible button fail. | PO | The contract's rule is only half true — therapists can still upload via record attachments. |
| — | **Should support tickets confirm real email delivery?** Today the API answers *"we received your report"*, not *"the email arrived"* — AWS SES errors are only logged (`Mail.service.ts`). Fixing it changes behaviour for **every** email the platform sends, so it wasn't done unilaterally. | PO | A silently failed SES send looks like success to the user. Low risk, non-zero. |

### Needs approval — one-line changes

| # | Item | Owner | If ignored |
|---|---|---|---|
| **Q14** | **Add `@babel/runtime` to `dependencies`.** `.babelrc` enables `@babel/plugin-transform-runtime`, which compiles code to `require('@babel/runtime/...')`, but that package is in neither `dependencies` nor `devDependencies`. | PO → backend | 🔴 **A clean `npm ci && npm run build && npm start` crashes.** This blocks deploying any of this work. Existing servers survive only on a stale `node_modules`. |
| **Q16** | **Fix `npm run db:migrations`.** It does `cd src`, picking up the stale tracked `src/knexfile.ts` whose migrations path resolves to a directory that doesn't exist. | PO → backend | Migrations fail with `ENOENT`. **Workaround: run `npx knex migrate:latest` from the repo root** — that's how `3033` was applied. *Deferred by PO 2026-08-02.* |

### Front-end work required

| # | Item | Owner | If ignored |
|---|---|---|---|
| **1** | **P8 — send `aHelpTypes` as an array** instead of a single `sHelpType` + `iHelpAmount`. See [`frontEndChanges.md`](frontEndChanges.md) entry 1. | Front-end | 🔴 Only one help type per record would be saved. A temporary compatibility shim will keep the old form working, so nothing breaks immediately. |
| **3** | **P5 — skip `fetchIep()` in therapist mode** (`students/[id]/index.vue:335`). | Front-end | Harmless — a silent, always-403 request in the network log. Cosmetic only. |

### Deferred cleanup (no action needed)

| Item | Why it's being left |
|---|---|
| **`TrackingRecords.sSupportUsed`** — will be superseded by the `TrackingRecordHelps` table in P8. | It holds a single value so it cannot serve the multi-type model, and it has never been written to. Dropping a column from a live schema is irreversible and deserves its own approval. Marked superseded, left in place. |
| **`src/knexfile.ts`** — stale duplicate of the root `knexfile.ts`. | Same as Q16 — deferred by the PO. |

### Waiting on the client

| Item | Needed by |
|---|---|
| **Live Stripe keys** (secret + webhook signing secret) and confirmation of MXN currency. Development uses the existing MyVillage **test-mode** keys, so P3 can be built and verified without them. | Before P3 can go live |

---

## Environment variables introduced so far

| Variable | Default | Feature | Purpose |
|---|---|---|---|
| `SUPPORT_EMAIL` | `info@myvillage.com.mx` | P10 | Where tickets are emailed |
| `SUPPORT_SMS_ENABLED` | *(off)* | P10 | `true` turns on the SMS heads-up |
| `SUPPORT_PHONE` | *(none)* | P10 | Destination number for that SMS |

All optional — the features work with none of them set.
