---
name: myvillage-backend
description: MUST USE before writing, editing or reviewing ANY code in the myVillageBackEnd project (Express + TypeScript + Knex/Objection + PostgreSQL API). Loads the architecture blueprint, this project's real conventions, and the mandatory process rules (ask instead of assuming, challenge frontend proposals, keep the implementation + frontEndChanges trackers, one commit per feature). Triggers on: any new API module, migration, controller, query, validation, route, model, permission gate, SES email, Stripe/billing work, or any task touching src/Api, knex/db/migrations, Services, Utils or Middlewares in this repo.
---

# MyVillage Backend Development

Authoritative guides for this repository. **Read them before writing code — do not work from
memory of them.**

## Read these files, in this order

1. **`.claude/skills/SKILL.md`** — architecture blueprint: stack, module layout, migration
   template, model/queries/controller/routes patterns, file-upload pattern, permissions,
   response format, do's and don'ts. Written generically (for SHIPO); use it for *shape*.

2. **`.claude/skills/WORKING_AGREEMENT_SKILL.md`** — **wins over #1 on any conflict.** Contains:
   - **Part 1 — process rules** (non-negotiable): ask instead of assuming; the signed
     requirements PDF governs scope; challenge frontend proposals that are redundant,
     off-convention, structurally worse, inefficient or unsafe; explain before coding;
     branch/commit discipline; the two mandatory tracker files; never break what works.
   - **Part 2 — this project's real conventions**, i.e. where the blueprint is wrong:
     `sSchoolId` (not `sEnterpriseId`), `sp`/`en` message keys (not `es`),
     `.controllers.ts` plural, `30NN_` migration series with indexes in a chained `.then()`,
     route registration in `src/Api/000_Index/Index.routes.ts`, `res.locals` contract,
     FACULTY per-student assignment checks, denormalized `dProgress`/`dAverageValue`/
     `iRecordsCount`/`tLastRecord` recomputed by `recalculateGoalProgress()` (never duplicate
     it), UPPERCASE enum casing, dual response field names, fire-and-forget SES.
   - **Part 3 — the 11-step new-module checklist.**

3. **`.claude/skills/STATUS_RECORDS_SKILL.md`** — only for status-tracking / state-machine work.

## Non-negotiables (full detail in the files above)

- **Ask, don't assume.** Unclear business rule, or signed PDF vs frontend guide conflict →
  stop and ask the user. Never pick a plausible reading and ship it.
- **The frontend's "backend guide" is a peer proposal, not orders.** Do it the professional way,
  keep the wire contract compatible where cheap, and log every divergence in
  `documentationForFront/NewScopeAug2026/frontEndChanges.md`. Never break the frontend silently.
- **Explain before coding** — tables/columns, endpoints, business rules encoded, what you are
  deliberately not doing.
- **Trackers are part of the feature**, updated in the same commit:
  `documentationForFront/NewScopeAug2026/implementationTracket.md` (what/how/decisions) and
  `frontEndChanges.md` (what the frontend must change).
- **One commit per completed feature**, on a feature branch, never on `main`.
- **Additive only:** new columns nullable/defaulted, new request fields optional, existing
  response field names never renamed (alias instead).

## Current work

Scope extension closed 24/jul/2026, 7 points — branch `features02Aug2026`.
Requirements: `futureFeatures/NewScopeAug2026/My Village_ Ampliación de alcance -  Cerrado 24_Julio_2026  (1).pdf`
Frontend contracts: `futureFeatures/NewScopeAug2026/Front_*.md` (mirrored from the frontend repo's
`docs/addons-julio2026/` — re-mirror before trusting them, they go stale).
Status and open questions: `documentationForFront/NewScopeAug2026/implementationTracket.md`.
