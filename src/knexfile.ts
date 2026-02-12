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
            database: process.env.DB_NAME_PRODUCTION,
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