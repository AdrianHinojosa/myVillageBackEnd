# Feature Guide — Ampliación de alcance (Aug 2026)

**For:** the frontend team, QA, and anyone picking this up later
**Backend branch:** `features02Aug2026`
**Last updated:** 2026-08-02

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
them is rejected with a 400.

---

# Status at a glance

| # | Feature | Backend state | New table? | New endpoints |
|---|---|---|---|---|
| 10 | Support tickets | ✅ **Built** (`271e9a1`) | No | 1 |
| 8 | Help types | 🔄 Designed, not built | Yes — `TrackingRecordHelps` | 0 (extends existing) |
| 5 | Therapist mode | ⬜ Not started | No — 1 new column | 0 (extends existing) |
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
| `400` | A field is missing, too long, an invalid category, **or you sent an extra field** |
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

### SMS — built but switched off

An SMS heads-up via AWS SNS is wired in and dormant. It sends **only** when both
`SUPPORT_SMS_ENABLED=true` and `SUPPORT_PHONE=<number>` are set. No destination number has been
provided yet, so nothing sends today.

### ⚠️ One honest limitation

The email system is "fire and forget" — it hands the message to AWS and never checks the result.
If AWS rejects it, the error is only written to the server log. **So the success message means
"we received your report", not "the email arrived".** Changing this would affect every email the
platform sends, so it wasn't done unilaterally — flagged for a decision.

---

# 🔄 Punto 8 — Help types (designed, not yet built)

> ⚠️ **Not built yet.** Design below is approved and about to be implemented. It **differs from
> what the frontend currently has**, so read [`frontEndChanges.md`](frontEndChanges.md) entry 1.

### What it does, in one paragraph

When a teacher logs a session result, they can also record **what kinds of support the student
needed** and **how much of each**, on a 0–10 scale — for example Visual 8, Verbal 7, Written 6.
This is purely descriptive, like a note: it **never** changes the goal's progress, average, or
record count. On the chart, each point is coloured by the support type with the highest value.

### The important change from what the frontend built

The frontend currently sends **one** support type per record (`sHelpType` + `iHelpAmount`). The
client's model — confirmed from their mock-up, which lists all 8 types each with its own value box
— is **several types per record, each with its own number**. That is what the backend will build.

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
- `aHelpTypes: []`, or omitting it, means no support was recorded.
- Repeating the same `sHelpType` twice returns `400`.
- On `PUT`, the array you send **replaces** everything previously recorded for that record. Omit
  the field to leave the existing set alone.

**What you get back** — the same shape, on every record in every GET.

### It does not affect any calculation

Worth stating plainly because the contract insists on it: progress, average, record count and the
"last 3 records" rule read only the measurement fields (`iHits`, `iScaleValue`, `iOccurrences`,
and so on). Help types are stored alongside and are never consulted. Adding, editing or removing
them cannot move a student's progress by a single point.

### Chart colouring (frontend side)

A record with Visual 8, Verbal 7 and Written 6 has no single "the" support type, so the contract's
"one colour per point" rule needed a tiebreak. **Decision: colour the point by the type with the
highest value**, and show that number as the point label; ties fall back to the canonical order of
the 8 types so it's deterministic. The full breakdown can go in the tooltip. **No API change** —
the backend returns the array and the frontend picks the maximum.

### Backwards compatibility during the transition

So the frontend isn't broken the moment the backend deploys, `POST`/`PUT` will **also** accept the
old single-value form (`sHelpType` + `iHelpAmount`) and store it as a one-item array. This is a
temporary shim, marked in the code for removal once the frontend ships the new capture UI.

---

# ⬜ Punto 5 — Therapist mode *(not started)*

Planned: one new column `sAccountType` on `Schools` (`SCHOOL` | `THERAPIST`, default `SCHOOL`),
settable by the superadmin when creating or editing a school, and returned inside `oSchool` on
login so the frontend can switch its terminology. Documented here once built.

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

## Environment variables introduced so far

| Variable | Default | Feature | Purpose |
|---|---|---|---|
| `SUPPORT_EMAIL` | `info@myvillage.com.mx` | P10 | Where tickets are emailed |
| `SUPPORT_SMS_ENABLED` | *(off)* | P10 | `true` turns on the SMS heads-up |
| `SUPPORT_PHONE` | *(none)* | P10 | Destination number for that SMS |

All optional — the features work with none of them set.
