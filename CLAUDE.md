
# Project Instructions

Before writing ANY code, read these two files completely, in this order:

1. `.claude/skills/SKILL.md` — the generic architecture blueprint (stack, module layout, patterns).
2. `.claude/skills/WORKING_AGREEMENT_SKILL.md` — how to work on THIS project: the process rules
   (ask instead of assuming, challenge the frontend when it's wrong, mandatory trackers, commit
   discipline) and every place where MyVillage deviates from the generic blueprint
   (`sSchoolId` not `sEnterpriseId`, `sp`/`en` message keys, `.controllers.ts` plural, `30NN_`
   migrations, denormalized progress fields, enum casing, dual response field names).

Where the two disagree, `WORKING_AGREEMENT_SKILL.md` wins — it describes the code that actually
exists here.

Follow every convention, naming pattern, file structure, and workflow described there.

When creating new modules, replicate the exact patterns from the skill files.

For status-tracking / state-machine work, also read `.claude/skills/STATUS_RECORDS_SKILL.md`.
