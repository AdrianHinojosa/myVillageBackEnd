# Implementation Tracker — Ampliación de alcance (cerrada 24/jul/2026)

**Branch:** `features02Aug2026`
**Backend repo:** `myVillageBackEnd`
**Started:** 2026-08-02
**Scope source of truth:** `futureFeatures/NewScopeAug2026/My Village_ Ampliación de alcance -  Cerrado 24_Julio_2026  (1).pdf`
**Frontend contract docs:** `futureFeatures/NewScopeAug2026/Front_*.md`

> Companion file: [`frontEndChanges.md`](frontEndChanges.md) — everything the frontend must change to integrate.

---

## Status board

| # | Punto | Backend weight | Status | Commit |
|---|---|---|---|---|
| 10 | Tickets de soporte | 1 endpoint + SES email + shared auth gate | ⬜ Not started | — |
| 8 | Tipos de ayuda | 1 existing column + 1 new | ⬜ Not started | — |
| 5 | Modo terapeuta | 1 column + login payload | ⬜ Not started | — |
| 7 | Submetas | schema + 6 endpoints + calculated fields | ⬜ Blocked on decisions | — |
| 3 | Cobranza automática (Stripe) | full module + webhooks + dunning | ⬜ Blocked on decisions | — |
| 11 | Guía de creación de metas | none (frontend only) | ➖ N/A backend | — |
| 13 | Módulo de capacitaciones | none (frontend only) | ➖ N/A backend | — |

Legend: ⬜ not started · 🔄 in progress · ✅ done & committed · ➖ no backend work · ⛔ blocked

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

5. **`Goals.sStatus` cannot be set to `PAUSED` through the API.** DB comment allows
   `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED`, but `CompleteGoalBody` only validates
   `COMPLETED | NOT_ACHIEVED | ACTIVE`. Punto 7 requires `PAUSED` for subgoals, and the
   frontend's `ISubGoal.sStatus` type includes it.

6. **`Goals` has no `iTargetPercentage` column**, although the signed PDF lists "porcentaje
   objetivo (0–100)" as a subgoal field, the frontend guide repeats it, and `ISubGoal` declares it.

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

10. **No Stripe dependency installed yet.** `package.json` has no `stripe` package; the raw-body
    handling a webhook signature check needs is also not set up. Both are part of P3.

11. **Out of scope but present:** the frontend repo added `docs/BACKEND_FEEDBACK_02APR2026.md`
    (413 lines), `BACKEND_FEEDBACK_LOGIN_USERTYPE.md`, `BACKEND_FIX_STUDENT_REPORT.md`,
    `BACKEND_TODO_25MAR2026.md` and `CLIENT_ISSUES_02APR2026.md`. These predate this scope and
    are **not** part of the 24/jul/2026 extension. Do not silently fold them in.

---

## Decisions log

| # | Topic | Decision | Rationale | Date |
|---|---|---|---|---|
| — | — | *(awaiting PO answers — see "Open questions" below)* | — | — |

---

## Open questions blocking work

Tracked here as they are asked/answered. See the conversation for full phrasing.

| ID | Punto | Question | Status |
|---|---|---|---|
| Q1 | 8 | Store help type in the existing `sSupportUsed` column (UPPERCASE codes, slug↔code mapped at the API boundary so the frontend keeps `sHelpType` + its lowercase slugs), or add a second `sHelpType` column exactly as the guide asks? | ⬜ Open |
| Q2 | 7 | Subgoals as self-referencing `Goals` rows (reuses the progress engine, `GoalTasks`, `GoalFiles`; frontend contract unchanged) vs. a separate `SubGoals` table as the guide proposes (duplicates the engine)? | ⬜ Open |
| Q3 | 7 | Sequential subgoals (signed PDF) vs. independent statuses (frontend/PO deviation)? Needs client confirmation — they signed for sequential. | ⬜ Open |
| Q4 | 7 | `iTargetPercentage`: add to subgoals only, or to `Goals` as well (it's missing there too)? | ⬜ Open |
| Q5 | 7 | Allow `PAUSED` on the existing goal status endpoint too, or only on subgoals? | ⬜ Open |
| Q6 | 5 | Should the backend *enforce* therapist restrictions (single user, no IEP, no documents) or only expose the flag as the guide says? | ⬜ Open |
| Q7 | 3 | Both billing modalities (`FIXED` + `VARIABLE`) is what the frontend built and the guide states, but the signed PDF says they are *"alternativas y NO acumulables"* and prices only the variable. Confirm both are in scope. | ⬜ Open |
| Q8 | 3 | Stripe account + secret key (test/live) available? Currency MXN confirmed? Without keys P3 cannot be tested end-to-end. | ⬜ Open |
| Q9 | 3 | Is "usuario principal del colegio" the school user with `sCreatedBy === null`? (that's the only marker in the schema) | ⬜ Open |
| Q10 | 10 | Should support tickets be reachable by superadmin tokens too (guide says yes; needs a new combined auth gate)? | ⬜ Open |
| Q11 | 3 | Who creates the Stripe subscription, and when? On first card added, or when the superadmin sets the tariff? The guide never says. | ⬜ Open |
| Q12 | 3 | Suspension enforcement: block at login only (frontend redirect), or also reject every API call from a `SUSPENDED` school (`bBlocked`-style gate in the middleware)? | ⬜ Open |

---

## Per-point implementation notes

### Punto 10 — Tickets de soporte
*(not started)*

### Punto 8 — Tipos de ayuda
*(not started)*

### Punto 5 — Modo terapeuta
*(not started)*

### Punto 7 — Submetas
*(not started)*

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
| — | — | — |
