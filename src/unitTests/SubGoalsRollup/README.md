# P7 — Sequential stages, own title, and the average window

Integration tests for Lucy's feedback of **2026-08-17 and 2026-08-18**:

* [`feedback-lucy-agosto2026-backend.md`](../../../documentationForFront/NewScopeAug2026/newFixesAug17/feedback-lucy-agosto2026-backend.md) — the original report
* [`guia-frontend-submetas-secuenciales-18ago2026.md`](../../../documentationForFront/NewScopeAug2026/newFixesAug17/guia-frontend-submetas-secuenciales-18ago2026.md) — what the frontend must change

```bash
npm run test:subgoals          # everything
npm run test:subgoals -- 02    # only 02_sequentialStages
```

**109 assertions, 0 failures, ~45 s.**

---

## The two rules these tests pin down

> **1. A goal's or subgoal's `dProgress` = the average of ALL its non-excluded records.**
> This replaces the "last 3 records" window documented in the frontend's `docs/REGLAS_DE_NEGOCIO.md`
> §7.4 and §13.2. It applies to goals and subgoals alike (client + PO, 2026-08-18).
>
> **2. A divided goal's `dProgress` = that of its stage IN PROGRESS. It averages nothing.**
> With no stage in progress, the **last closed** stage; with nothing started, 0.
> The client's words: *"lo que no quiero es que se promedien la submeta 1 y la submeta 2 para que en
> la meta me dé un 50%, porque no es real."*

Rule 2 only makes sense if "the stage in progress" has a single answer, so the backend enforces the
**sequential invariant**: at most **ONE** subgoal of a goal is `ACTIVE`.

---

## What each file covers

| File | Covers |
|---|---|
| `01_subGoalTitle` | A subgoal stores its **own** `sTitle` on create and on update; a blank title inherits the parent's; a partial edit does not blank the rest |
| `02_sequentialStages` | The whole sequential machine **and** the mirror: new stages queue as `PAUSED`, closing one promotes the next, reopening one demotes the current, deleting the current hands the baton on — and the goal's `dProgress` follows the stage in progress at every step, including the drop to **0%** when a stage is closed and the next has no records |
| `03_studentReport` | `GET /students/:id/report` includes the divided goal (it used to **vanish**), with its stages' records in its card, each labelled with `sSubGoalId` / `sSubGoalTitle` |
| `04_averageWindow` | The average uses the **whole** history: 4 records of 100/100/100/0 give **75%**, not the 100% the last-3 rule would give. Checked on an ordinary goal *and* on a subgoal, to prove the rule is one and the same |

## The sequential machine, in a table

`02_sequentialStages` walks these transitions and asserts the goal's figure after each one:

| Action | Side-effect the backend applies | Goal |
|---|---|---|
| Create the 1st stage | it becomes `ACTIVE` | 0% (no records) |
| Create the 2nd and 3rd (sending `sStatus: ACTIVE`) | ignored → they queue as `PAUSED` | unchanged |
| Log a record on the stage in progress | — | = that stage's % |
| Log a record on a `PAUSED` stage | **409** | unchanged |
| Close the stage in progress | the next unfinished stage becomes `ACTIVE` | = the new stage's % (0% if empty) |
| Set a closed stage back to `ACTIVE` | the stage in progress drops to `PAUSED` | = the reopened stage's % |
| Set the stage in progress to `PAUSED` | none is in progress | = the last closed stage |
| Close every stage | — | = the last closed stage, by order |
| Delete the stage in progress | the next unfinished stage becomes `ACTIVE` | = the new stage's % |
| Delete the last stage | — | 0, and the goal behaves like an ordinary goal again |

`iRecordsCount` and `tLastRecord` on the goal are the **sum** and the **max** across every stage, not
those of the stage in progress: they answer *"how much has been logged on this goal"*, which is what
the report prints, and they are not percentages, so they cannot distort rule 2.

## The client's acceptance criteria

All three are tested literally in `02_sequentialStages`:

1. *"Submeta 1: 80% — siempre y cuando esta submeta esté activa, la meta es 80%"*
2. *"Se cierra la submeta 1… Submeta 2: 20% — siempre y cuando esta submeta esté activa, meta 20%"*
3. *"Lo que no quiero es que se promedien la submeta 1 y la submeta 2 para que en la meta me dé 50%"*
   → there are explicit assertions that the value is **not** the average (`!== 30`, `!== 55`).

## Safety

* **`development` only.** `assertSafeDatabase()` aborts before the first query if
  `current_database()` is not `development` — this suite writes goals and records.
* **No residue.** Everything created is titled `ZZTEST-P7…`, is deleted in teardown (records →
  subgoals → goals, respecting the `sParentGoalId` FK), and a final check fails the run if anything is
  left. Pre-existing goals, subgoals and records are never touched.
* **No passwords.** Tokens are minted through the app's own `AuthServices.createToken`, and the
  sessions are deleted at the end.

## Fixtures

A school with a main user (`Users.sCreatedBy IS NULL`), not blocked, not suspended, **with an active
student**. The student has to be active: every goal aggregate joins `Students` filtering on `bActive`,
so a goal belonging to an inactive student silently drops out of the queries under test — a detail
that already invalidated one result in this project.

## How this relates to the migrations and the script

| | |
|---|---|
| `3038_Goals_backfillSubGoalRollup` | The first backfill (2026-08-17), from when the rule was the average of the stages. Superseded by `3039`; kept because it already ran. |
| `3039_Goals_sequentialSubGoals` | Normalises statuses to the sequential invariant and **recomputes** every percentage with the new rules |
| `npm run recalc:progress` | The same recomputation, on demand and re-runnable ([`src/scripts/recalculateProgress.ts`](../../scripts/recalculateProgress.ts)) |

These tests cover the live path (create / log / close / delete); the migration covers history. Both
use **the same engine**, so they cannot disagree.

## A trap that already caught us once

`readSubGoalRows()` in `helpers.ts` **must** select `sStatus`. While it did not, four assertions read
`undefined` — and one of them (`count of ACTIVE === 0`) **passed by accident**. When adding assertions
about new columns, add those columns to the helper's `select` too.
