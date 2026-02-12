// productionMigrationUpdate.ts
// NODE_ENV=production npx ts-node productionMigrationUpdate.ts 2020 --dry

import knexConfig from "./src/knexfile";
import * as process from "process";

const environment = process.env.NODE_ENV || "production";
const knex = require("knex")(knexConfig[environment]);

/**
 * Bumps every migration whose 4-digit prefix is > basePrefix by +1.
 * Pass basePrefix as a string, e.g. "8081".
 */
async function bumpMigrationNumbers(basePrefix: string, dryRun = false) {
  const base = parseInt(basePrefix, 10);
  if (Number.isNaN(base) || basePrefix.length !== 4) {
    throw new Error("Base prefix must be a 4-digit number, e.g. 8081");
  }

  // Postgres: left(name,4)::int returns the numeric prefix
  const migrations = await knex("knex_migrations")
    .whereRaw("left(name, 4)::int > ?", [base])
    .orderBy("name", "desc");

  if (!migrations.length) {
    console.log(`[${basePrefix}] No rows to update – nothing to do.`);
    return;
  }

  console.log(
    `[${basePrefix}] Will bump ${migrations.length} row(s):\n` +
      migrations.map((m: any) => `  ${m.name}`).join("\n")
  );

  if (dryRun) return; // ← preview mode

  await knex.transaction(async (trx) => {
    for (const m of migrations) {
      const oldName: string = m.name;
      const newPrefix = (parseInt(oldName.slice(0, 4), 10) + 1)
        .toString()
        .padStart(4, "0");
      const newName = newPrefix + oldName.slice(4);

      await trx("knex_migrations").where("name", oldName).update({ name: newName });

      console.log(`  ✔ ${oldName} → ${newName}`);
    }
  });

  console.log(`[${basePrefix}] Done.`);
}

(async () => {
  const base = process.argv[2];
  if (!base) {
    console.error("Usage: ts-node productionMigrationUpdate.ts <basePrefix> [--dry]");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry");
  try {
    await bumpMigrationNumbers(base, dryRun);
  } finally {
    await knex.destroy();
  }
})();
