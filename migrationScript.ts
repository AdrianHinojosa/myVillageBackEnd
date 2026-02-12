// HOW TO RUN:
// npm run migrate-script -- 2016_Customers.ts

import knexConfig from "./src/knexfile";

let Environment: string = '';
switch (process.env.NODE_ENV) {
    case 'development':
        Environment = 'development'
        break;
    default:
        Environment = process.env.NODE_ENV
        break;
}
const config: any = knexConfig[Environment];
const knex = require("knex")(config);

import fs from "fs";
import path from "path";
const migrationsDir = path.join(__dirname, '/knex/db/migrations');

// Retrieve the base migration number from the filename
const baseMigrationNumber = process.argv[2].match(/^(\d+)/)[0];

async function renameAndUpdateMigrations() {
    const migrations = fs.readdirSync(migrationsDir).sort();
    const start = migrations.findIndex(file => file.startsWith(baseMigrationNumber));

    if (start === -1) {
        console.error('Specified migration not found');
        return;
    } 

    try {
        // Start transaction
        await knex.transaction(async trx => {
            for (let i = migrations.length - 1; i > start; i--) {
                const oldName = migrations[i];
                const newName = oldName.replace(/^(\d+)/, (match, number) => String(Number(number) + 1).padStart(4, '0'));

                // Rename files on filesystem
                fs.renameSync(path.join(migrationsDir, oldName), path.join(migrationsDir, newName));

                // Update records in database
                await trx('knex_migrations')
                    .where('name', oldName)
                    .update({
                        name: newName
                    });
            }
        });

        console.log('Migration files and database records updated successfully.');
    } catch (error) {
        console.error('An error occurred during the migration renaming process:', error);
    }
}

renameAndUpdateMigrations();
