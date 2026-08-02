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
| 10 | Tickets de soporte | 1 endpoint + SES email | ⬜ Not started | — |
| 8 | Tipos de ayuda | 1 existing column + 1 new | ⬜ Not started | — |
| 5 | Modo terapeuta | 1 column + login payload | ⬜ Not started | — |
| 7 | Submetas | schema + endpoints + rollup | ⬜ Blocked on decisions | — |
| 3 | Cobranza automática (Stripe) | full module | ⬜ Blocked on decisions | — |
| 11 | Guía de creación de metas | none (frontend only) | ➖ N/A backend | — |
| 13 | Módulo de capacitaciones | none (frontend only) | ➖ N/A backend | — |

Legend: ⬜ not started · 🔄 in progress · ✅ done & committed · ➖ no backend work · ⛔ blocked

---

## Environment / repo findings recorded at kickoff (2026-08-02)

These are facts discovered while reading the code, kept here so nobody re-derives them.

1. **The frontend working copy does NOT contain the Aug-2026 features.**
   `root/myVillage` is on branch `mainCopy`, last commit `21feafe` (31/mar/2026). Greps for
   `support/ticket`, `sHelpType`, `subGoals`, `sSubGoalId`, `sAccountType`, `bHasSubGoals`,
   `TicketModal.vue`, `capacitaciones`, `GoalDescriptionBuilder.vue` all return **zero hits**, and
   `myVillage/docs/` has no `addons-julio2026/` folder. The frontend guides describe work that is
   not in this clone. **Consequence:** the guides are the only contract we can code against; they
   cannot be verified against real frontend code. Field-name mismatches will surface at
   integration, so `frontEndChanges.md` is the mechanism to resolve them.

2. **`TrackingRecords.sSupportUsed` already exists** (migration `3021_TrackingRecords.ts:10`) with
   the comment `INDEPENDENT|GENERAL|VISUAL|VERBAL|WRITTEN|GESTURAL|MODELING|PHYSICAL` — i.e. the
   exact 8 help types of Punto 8. It is never read or written by any query. Punto 8 should adopt
   it instead of adding the frontend's proposed new `sHelpType` column.

3. **`Goals.sStatus` cannot be set to `PAUSED` through the API.** DB comment allows
   `ACTIVE | COMPLETED | NOT_ACHIEVED | PAUSED`, but `CompleteGoalBody` only validates
   `COMPLETED | NOT_ACHIEVED | ACTIVE`. Punto 7 requires `PAUSED` for subgoals.

4. **`Goals` has no `iTargetPercentage` column**, although the signed PDF lists "porcentaje
   objetivo (0–100)" as a subgoal field and the frontend guide repeats it.

5. **Progress is denormalized and computed in one place.**
   `Goals.dProgress / dAverageValue / iRecordsCount / tLastRecord` are stored columns, recomputed
   inside the write transaction by `TrackingRecordQueries.recalculateGoalProgress()` — a ~140-line
   function branching on `sMeasurementType` × `sDirection`, averaging the **last 3 non-excluded**
   records. This function must not be duplicated for subgoals.

6. **Superadmin cannot pass `verifySchoolUserPermissions`.** School and administrator tokens go
   through different middleware. Any endpoint that must serve both (e.g. the support ticket form)
   needs an explicit gate.

7. **Email is fire-and-forget.** `MailEvent.emit('SendEmail', …)` swallows SES errors inside the
   listener, so a controller cannot know whether delivery succeeded.

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
| Q1 | 8 | Reuse existing `sSupportUsed` column + UPPERCASE enum, or add frontend's `sHelpType` with lowercase Spanish slugs? | ⬜ Open |
| Q2 | 7 | Subgoals as self-referencing `Goals` rows (reuses progress engine) vs. separate `SubGoals` table (frontend's proposal, duplicates engine)? | ⬜ Open |
| Q3 | 7 | Sequential subgoals (signed PDF) vs. independent statuses (frontend/PO deviation)? | ⬜ Open |
| Q4 | 7 | Add `iTargetPercentage` to goals+subgoals, or drop it from scope? | ⬜ Open |
| Q5 | 7 | Allow `PAUSED` via the complete/status endpoint? | ⬜ Open |
| Q6 | 5 | Should the backend *enforce* therapist restrictions (single user, no IEP, no documents) or only expose the flag? | ⬜ Open |
| Q7 | 3 | Which billing modality did the client choose — fixed or variable? (only variable was priced) | ⬜ Open |
| Q8 | 3 | Stripe keys / account / currency available? | ⬜ Open |
| Q9 | 3 | Is "usuario principal del colegio" the school user with `sCreatedBy === null`? | ⬜ Open |
| Q10 | 10 | Should support tickets be reachable by superadmin tokens too? | ⬜ Open |

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
| 7 | Submetas are **sequential**: only one active at a time, must close one to advance; main goal progress = active subgoal | Frontend guide says each subgoal has an independent status, no sequencing; main progress = average of *started* subgoals | ⛔ **Pending PO confirmation** (Q3) | — |
| 11 | Static **image** provided by client | Frontend guide says a programmed guided builder (8 coloured segments) replaces the image | Noted — frontend-only, no backend impact | 2026-08-02 |

---

## Commit log

*(one row per commit on `features02Aug2026`)*

| Commit | Point | Summary |
|---|---|---|
| — | — | — |
