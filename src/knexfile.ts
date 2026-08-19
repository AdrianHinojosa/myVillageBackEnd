/**
 * NOTE FOR MAINTAINERS
 *
 * This is NOT the knexfile the CLI uses. `npm run db:migrations|db:rollback|db:seeds` run from the
 * repo root and therefore pick up the ROOT `knexfile.ts`.
 *
 * This copy exists solely because the two root helper scripts import it for its connection config:
 *   - migrationScript.ts            (`npm run migrate-script`)
 *   - productionMigrationUpdate.ts  (`npm run update-prod-migrations`)
 * Both compute the migrations directory themselves, so the `directory` values below are unused —
 * they would resolve to `src/knex/db/migrations`, which does not exist.
 *
 * Until 2026-08-11 the npm scripts did `cd src` first, which made the CLI load THIS file and fail
 * with `ENOENT ... scandir '.../src/knex/db/migrations'`. Keep the scripts running from the root.
 */
import path from "path";
require('dotenv').config({ path: '.env' });

export default {
    development: {
        client: 'pg',
        connection: {
            host:  process.env.DB_HOST,
            port: 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, 
            database: process.env.DB_NAME,
            // The key part: Force SSL
            ssl: {
              rejectUnauthorized: false,
            },
        },
        searchPath: ['knex', process.env.PG_SCHEMA],
        migrations: {
            tableName: 'knex_migrations',
            directory: path.join(__dirname, '/knex/db/migrations')
        },
        seeds: {
            directory: path.join(__dirname, '/knex/db/seeds')
        },
        ssl: {
            rejectUnauthorized: false
          }          
    },
    production: {
        client: 'pg',
        connection: {
            host:  process.env.DB_HOST,
            port: 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, 
            database: process.env.DB_NAME,
            // The key part: Force SSL
            ssl: {
              rejectUnauthorized: false,
            },
        },
        searchPath: ['knex', process.env.PG_SCHEMA],
        migrations: {
            tableName: 'knex_migrations',
            directory: path.join(__dirname, '/knex/db/migrations')
        },
        seeds: {
            directory: path.join(__dirname, '/knex/db/seeds')
        },
        ssl: {
            rejectUnauthorized: false
        }
    },
    local: {
        client: 'pg',
        connection: process.env.PG_CONNECTION_LOCAL,
        searchPath: ['knex', process.env.PG_SCHEMA],
        migrations: {
            tableName: 'knex_migrations',
            directory: path.join(__dirname, '/knex/db/migrations')
        },
        seeds: {
            directory: path.join(__dirname, '/knex/db/seeds')
        }
    }
};