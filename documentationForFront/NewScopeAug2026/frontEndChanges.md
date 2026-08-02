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

## ⚠️ Blocking note (2026-08-02)

The frontend working copy at `root/myVillage` (branch `mainCopy`, last commit `21feafe`,
31/mar/2026) contains **none** of the Aug-2026 features. Greps for `support/ticket`, `sHelpType`,
`subGoals`, `sSubGoalId`, `sAccountType`, `bHasSubGoals`, `TicketModal.vue`, `capacitaciones`,
`GoalDescriptionBuilder.vue` return zero hits.

The backend is therefore coding against `futureFeatures/NewScopeAug2026/Front_*.md` only. If the
real frontend differs from those documents, **that** is what has to change — the entries below are
derived from the documents, so verify each against the actual implementation before acting.

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

### P8 — Help type: field name and enum values 🟡 *(pending Q1)*

- **Endpoints:** `POST /trackingRecords`, `PUT /trackingRecords/:sTrackingRecordId`, and every
  GET that returns records.
- **Frontend guide says:** send `sHelpType` with lowercase Spanish slugs
  `independiente | ayuda_general | visual | verbal | escrita | gestual | modelacion | fisica`,
  plus `iHelpAmount`.
- **Backend recommendation:** send **`sSupportUsed`** with the project's UPPERCASE codes
  `INDEPENDENT | GENERAL | VISUAL | VERBAL | WRITTEN | GESTURAL | MODELING | PHYSICAL`
  (plus `iHelpAmount`, unchanged).
- **Why:** the column `TrackingRecords.sSupportUsed` **already exists** (migration
  `3021_TrackingRecords.ts:10`) and is documented with exactly these 8 values. Adding a second
  column for the same concept would leave a permanently dead column and two sources of truth. The
  UPPERCASE code style is also the convention across `sStatus`, `sMeasurementType`, `sDirection` —
  lowercase Spanish slugs would be the only exception in the schema. Labels stay the frontend's
  job via i18n, so nothing visible to the user changes.
- **Mitigation available:** the backend can additionally **accept** `sHelpType` as an input alias
  and **echo** `sHelpType` in responses (this codebase already does dual naming for
  `sRecordId`/`sTrackingRecordId`, `dtDate`/`tRecordDate`, `sNotes`/`sObservations`). If the PO
  prefers zero frontend work, say so and we alias instead of renaming.

### P7 — Subgoal identifier field 🟡 *(pending Q2)*

- **Endpoints:** `GET/POST /goals/:sGoalId/subGoals`, `PUT/DELETE /subGoals/:sSubGoalId`,
  `GET /subGoals/:sSubGoalId/trackingRecords`, `POST /trackingRecords`.
- **Frontend guide says:** subgoals are a separate resource with their own id field `sSubGoalId`.
- **Backend recommendation:** keep the **URLs and the `sSubGoalId` field name exactly as
  specified** — no frontend change — while implementing subgoals internally as `Goals` rows with a
  `sParentGoalId`. Responses would carry **both** `sGoalId` and `sSubGoalId` (same value), matching
  the dual-naming convention already used for tracking records.
- **Why:** it avoids duplicating `recalculateGoalProgress()` (the ~140-line measurement engine),
  `GoalTasks`, `GoalFiles` and the records pipeline for a second entity. Every future fix to the
  progress engine then applies to subgoals automatically.
- **Frontend impact if approved:** **none** — this is an internal choice, listed here only for
  transparency.

---

## Resolved / already applied

*(entries move here once the frontend confirms the change is in)*
