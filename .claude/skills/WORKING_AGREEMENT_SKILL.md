# MyVillage Backend — Working Agreement & Project Deviations

**Version:** 1.0
**Last Updated:** 2026-08-02
**Purpose:** How to work on this backend. Covers (1) the process rules agreed with the PO, and
(2) the places where THIS project deviates from the generic blueprint in `SKILL.md`.

> **Read order:** `SKILL.md` (generic SHIPO blueprint) → **this file** (project reality + process).
> Where the two disagree, **this file wins** — it describes the code that actually exists here.

---

## PART 1 — HOW TO WORK (process rules, non-negotiable)

### 1.1 Ask, don't assume
If a business rule is **not clear**, **ambiguous**, or **contradicted** between the signed
requirements document and the frontend guides — **STOP and ask the user**. Do not pick a
plausible interpretation and code it.

What counts as "must ask":
- A rule that changes data shape or lifecycle (statuses, cascades, who owns a record).
- Money, billing cycles, proration, retries, suspension — anything the client pays on.
- Anything the signed PDF says one way and a frontend doc says another way.
- Anything the frontend contract implies but never states (nullability, defaults, limits).

What does NOT need asking (make the call, then write it down in the tracker):
- Naming, to keep existing conventions (Hungarian notation, `sp`/`en` keys, module numbering).
- Which file a function belongs in.
- Adding an index, a transaction, or a validation the frontend didn't ask for.

### 1.2 The signed requirements document governs scope
Source of truth for **what is owed to the client**:
`futureFeatures/NewScopeAug2026/My Village_ Ampliación de alcance -  Cerrado 24_Julio_2026  (1).pdf`

Frontend guides in the same folder describe the **integration contract**, not the scope. When a
frontend guide **deviates** from the signed PDF (it does — e.g. sequential subgoals), that
deviation must be **flagged to the user for a decision**, and the decision recorded in the tracker.
Never silently follow the frontend against the contract.

### 1.3 Challenge the frontend when it is wrong
The frontend writes "guides for backend". Treat them as a **proposal from a peer team**, not
orders. Push back, in writing, when a proposal is:
- **Redundant** — a column/table/concept that already exists (e.g. it asked for a new
  `sHelpType` column when `TrackingRecords.sSupportUsed` already exists for exactly that).
- **Off-convention** — naming or enum casing that breaks the codebase's own rules.
- **Structurally worse** — a parallel table that forces duplicating business logic that a
  self-reference or reuse would give for free.
- **Inefficient** — N+1 queries, unbounded lists, recomputation the DB could do once.
- **Unsafe** — trusting client-sent identity/amounts, missing tenant scoping, missing idempotency.

Rule: **do it the right way, keep the wire contract compatible where cheap, and log the
divergence** in `frontEndChanges.md` so the frontend can adapt. Never break the frontend silently.

### 1.4 Explain before coding
Before writing code for a feature, explain in the conversation, in plain language:
- what tables/columns change,
- what endpoints appear,
- what business rules are being encoded,
- what you are deliberately NOT doing (and why).
Wait for confirmation on anything flagged as a question.

### 1.5 Branch & commit discipline
- Work happens on a feature branch (current: `features02Aug2026`), never directly on `main`.
- **One commit per completed feature/point**, not per file. A feature is "complete" when
  migration + model + queries + validations + controller + routes + route registration +
  messages are all in and the project builds.
- Commit message: `P<point> — <short what>` plus a short body listing endpoints/columns added.
- Update both tracker files **in the same commit** as the feature.

### 1.6 Two mandatory tracker files
Both live in `documentationForFront/NewScopeAug2026/`:

| File | Owner | Content |
|---|---|---|
| `implementationTracket.md` | backend | What was implemented, **how**, decisions taken, what's committed, what's pending. Written for a teammate joining cold. |
| `frontEndChanges.md` | backend → frontend | Every change the frontend MUST make to integrate: renamed fields, changed enum values, new required fields, endpoints that differ from the frontend's own guide. Each entry: endpoint, what frontend has today, what it must send/read instead, why. |

Update them as work lands — not at the end. An entry the frontend can't act on (no endpoint, no
field name, no reason) is not an entry.

### 1.7 Never break what works
Existing goals/records/schools flows are live. When extending them:
- New columns are **nullable or defaulted** — never `notNullable` without a backfill.
- New request fields are **optional** in Joi unless the frontend already always sends them.
- Existing response fields keep their names. Add, don't rename. (This codebase already ships
  dual names on purpose — see §2.6.)
- If a list query could now return rows it never returned before (e.g. subgoals appearing in
  the goals list), that filter is part of the feature, not a follow-up.

---

## PART 2 — WHERE THIS PROJECT DIFFERS FROM `SKILL.md`

`SKILL.md` was written for SHIPO (logistics). MyVillage follows the same architecture with these
concrete differences. **Use the values in this column, not SKILL.md's.**

### 2.1 Tenancy
| SKILL.md | MyVillage |
|---|---|
| `sEnterpriseId` | **`sSchoolId`** |
| `Enterprises` table | **`Schools`** table |
| `verifyEnterpriseUserPermissions` | **`verifySchoolUserPermissions`** |
| — | also `verifySchoolUserHasAnyPermissions`, `denyFacultyAccess` |

Middleware lives in `src/Middlewares/001_Permissions.mw.ts/schools.permissions.ts`.
It sets `res.locals`: `sLang`, `sUserId`, `sSchoolId`, `sSessionId`, `sType`, `sTypeUser`,
`TokenData`. **Identity and tenant NEVER come from the request body.**

`res.locals.sType` is the school-user subtype: `'ADMINISTRATION'` (school admin) or `'FACULTY'`.
FACULTY is additionally restricted **per student** inside controllers via
`StudentAssignmentQueries.isStudentAssignedToUser(...)`. Replicate that check on any new
student-scoped endpoint.

Superadmin (Administrators) uses a **different** middleware/permission path — school middleware
will reject a superadmin token. Any endpoint that must serve both needs an explicit decision.

### 2.2 Language keys are `sp` / `en` — not `es`
```ts
SuccessMessages.Goals.createGoal[sLang]   // { sp: '...', en: '...' }
```
`src/Utils/SuccessMessage.util.ts` and `src/Utils/ErrorMessages.util.ts`, one top-level key per
module, alphabetically-ish grouped with `// ====== Module ======` banners. Add new modules at the
end, following the existing banner style.

### 2.3 File naming: `.controllers.ts` (plural)
Actual convention in `src/Api/`:
```
<module>.routes.ts        <module>.controllers.ts   <module>.queries.ts
<module>.validations.ts   <module>.model.ts
```
(`005_Administrators/administrators.controller.ts` is the lone singular legacy exception — do not
copy it.) A module with no persistence may omit `.model.ts`/`.queries.ts`.

### 2.4 Migrations
- Folder: `knex/db/migrations/`, numbering series **`30NN_`** (next free number wins).
- Name pattern for new tables: `30NN_TableName.ts`.
- Name pattern for altering: `30NN_TableName_whatChanged.ts` (e.g. `3028_Goals_sDirection_iTargetOpportunities.ts`).
- Run: `npm run db:migrations` (it `cd src` first — knexfile is resolved from `src/`).
- Indexes are created in a chained `.then()` with `Knex.schema.raw('CREATE INDEX ...')`, not
  inside the table callback. Follow `3017_Goals.ts` / `3021_TrackingRecords.ts`.
- `table.timestamps(true, true)` → columns are snake_case `created_at` / `updated_at`. Models
  only implement `$beforeUpdate()` here (no `$beforeInsert`, no `$afterFind` formatting).

### 2.5 Route registration
Every module router is mounted in `src/Api/000_Index/Index.routes.ts`:
```ts
app.use(BaseRoute(env, 'goals'), celebrate({ params: LanguageParams }), aH(Language()), aH(GoalRoutes));
```
Public URL = `{env}/api/v1/:sLang/<module>/...`. The frontend calls `/goals`, `/students`,
`/support/ticket` — the `/api/v1/:sLang` prefix is added by its axios base URL.

Note `trackingRecords` is mounted as a **top-level** module even though its code lives under
`024_Goals/003_TrackingRecords/`. Nested read routes (`/goals/:sGoalId/trackingRecords`) are
declared inside `goals.routes.ts`. Same trick is available for new sub-resources.

### 2.6 Response shape & the dual-naming convention
- Success responses: `res.status(201).json({ message, <entity>, success: true })`.
  **GETs also return 201** in this project. Keep it — the frontend treats 2xx uniformly.
- Login returns `200` with `{ message, status, results }`.
- Lists: `{ message, <entities>, iTotal, iNumPages, success }`.
- **Dual field names are deliberate.** `TrackingRecords` responses carry both the DB name and
  the frontend name (`sTrackingRecordId` **and** `sRecordId`; `tRecordDate` **and** `dtDate`;
  `sObservations` **and** `sNotes`; `iHits`/`iCorrect`; `iOccurrences`/`iFrequencyCount`;
  `iAchieved`/`iSuccessful`). See `trackingRecords.queries.ts` → `formatRecordsForFrontend`.
  When a frontend name must differ from the column name, **alias in the response** rather than
  renaming the column. This is the escape hatch that keeps both sides happy.
- Frontend axios interceptor auto-displays `response.data.message` for success **and** error.
  Every endpoint must return a localized `message`. Never hardcode Spanish in a controller.

### 2.7 Validation

> 🚨 **THE TRAP THAT BITES EVERYONE.** Every Joi error label is a **lookup key**, not free text.
> The label must be exactly `"<Group> <field>"`, and
> `src/Utils/ValidationError.util.ts → JoiValidationError[Group][field][sLang]` **must exist**.
> `ErrorHandler.mw.ts:131` does `Messages[err.type][type][message][langCode]` with no guard, so a
> missing entry throws `Cannot read properties of undefined (reading 'sp')` and the request returns
> **HTTP 500 instead of a validation error**. Adding a validated field without adding its catalogue
> entry ships a crash. This happened on P10, P5 *and* P8 during this scope.
>
> **Two consequences for testing:** a validation error surfaces as **HTTP 409** (not 400 — see
> `ErrorHandler.mw.ts`), and you must exercise validation **through HTTP with a valid token**.
> Calling `Schema.validate()` directly, or testing without auth, hides the bug — auth (401) and
> permission gates (403) run *before* `celebrate`, so they mask it.

`src/Middlewares/Validations.mw.ts` exports the reusable Joi builders. Every builder takes an
error label string: `Validations.RequiredUUID("Goals sGoalId")`.
- Wrap schemas in `Validations.JoiObjectKeys({...})`.
- **Add the matching `ValidationError.util.ts` entry in the same commit as the field.**
- `trackingRecords.validations.ts` uses raw `Joi.object({...}).options({ allowUnknown: true })`
  — that is intentional there (frontend sends type-specific extras). Prefer strict
  `JoiObjectKeys` for new modules.
- Params schemas that sit on nested routes often need `sLang: Joi.string()` added, because
  `mergeParams` brings `:sLang` into `req.params`. Check before you ship.

### 2.8 Soft deletes are the rule, with a wrinkle
`bActive: false` everywhere. `TrackingRecords` **also** has `tDeletedAt` and its queries filter
`.where('bActive', true).whereNull('tDeletedAt')`. Match the table you're touching.
`GoalTasks` are **hard-deleted and re-inserted** on goal update — that is existing behavior.

### 2.9 Denormalized calculated fields (important)
`Goals.dProgress`, `Goals.dAverageValue`, `Goals.iRecordsCount`, `Goals.tLastRecord` are
**stored columns**, recomputed inside the same transaction as every record
create/update/delete/exclude by `TrackingRecordQueries.recalculateGoalProgress(sGoalId, trx)`.

`recalculateGoalProgress` is the **single most business-critical function in the codebase**:
it averages the **last 3 non-excluded records** and branches on `sMeasurementType`
(`EXACTITUD | TAREAS | ESCALA | FRECUENCIA | DURACION | OPORTUNIDAD`) × `sDirection`
(`INCREASE | DECREASE`).

**Rule: do not duplicate it.** Any new entity that needs "goal-like" progress must reuse this
exact function, not a copy. If a feature seems to require a second copy, that is a signal the
schema should be reshaped so one function still serves (see the subgoals decision in
`implementationTracket.md`).

### 2.10 Enum casing convention
Stored enums are **UPPERCASE, English or Spanish-uppercase, underscore-separated**:
`sStatus` = `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED`;
`sMeasurementType` = `EXACTITUD | TAREAS | ESCALA | FRECUENCIA | DURACION | OPORTUNIDAD`;
`sDirection` = `INCREASE | DECREASE`;
`sSupportUsed` = `INDEPENDENT | GENERAL | VISUAL | VERBAL | WRITTEN | GESTURAL | MODELING | PHYSICAL`.
Never introduce `lower_snake_case` slugs. Labels are the frontend's job (i18n); the backend
stores the code only.

### 2.11 Email (AWS SES)
`src/Services/Mail.service.ts` exposes an EventEmitter:
```ts
MailEvent.emit('SendEmail', { aEmails, oData, sType, sSubject });
```
- `sType` must be added to the `IMailTypes['sType']` union **and** have a matching Handlebars
  template at `src/Views/<sType>.html`.
- Emission is **fire-and-forget** — the listener swallows errors (`console.error`). So a
  controller cannot report "email failed" to the user. If a feature requires delivery
  confirmation, that needs an explicit design decision, not an assumption.
- Templates receive `{ ...oData, sAssetsUrl }`.

### 2.12 Storage
`src/Services/Storage.services.ts` (AWS S3) + `express-fileupload`. Files go through the `Files`
table and a per-entity join table (`GoalFiles`, `TrackingRecordFiles`). Upload path convention:
`{sSchoolId}/{module}/{entityId}`.

### 2.13 Known gaps to be aware of
- `Goals.sStatus` supports `PAUSED` in the DB comment, but `CompleteGoalBody` validation only
  accepts `COMPLETED | NOT_ACHIEVED | ACTIVE` — `PAUSED` is unreachable via the API today.
- `Goals` has **no** `iTargetPercentage` column, though the scope document lists a target
  percentage field.
- `TrackingRecords.sSupportUsed` exists, is documented as the 8 help types, and is **never
  read or written** by any query — dead until Point 8 wires it up.
- `Schools` has only `bBlocked` as an account state — no billing/subscription state yet.
- `res.locals.sType` defaults to `'ADMINISTRATION'` when null; superadmin school users are
  identified by `sCreatedBy === null`.

---

## PART 3 — CHECKLIST FOR A NEW MODULE HERE

1. Migration `30NN_*.ts` (+ indexes in `.then()`), nullable/defaulted columns.
2. `npm run db:migrations`.
3. `<module>.model.ts` — interface + class + `tableName`/`idColumn` + relations + `$beforeUpdate`.
4. `<module>.validations.ts` — `JoiObjectKeys`, labels `"Table sField"`.
5. `<module>.queries.ts` — static class, filter `bActive`, scope by `sSchoolId` (directly or via
   parent), transactions for multi-table writes.
6. `<module>.controllers.ts` — read `res.locals`, verify parents exist AND belong to the school,
   FACULTY student-assignment check where applicable, `next(new MyError(code, msg[sLang]))`.
7. `<module>.routes.ts` — `aH(verifySchoolUserPermissions([...]))` **then** `celebrate({...})`
   **then** `aH(Controller.method)`.
8. Register in `src/Api/000_Index/Index.routes.ts`.
9. Add `SuccessMessages.<Module>` and `ErrorMessages.<Module>` with `sp` + `en`.
10. Update `implementationTracket.md` and (if the frontend must change) `frontEndChanges.md`.
11. Commit as one feature.
