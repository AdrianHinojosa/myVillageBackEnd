# SHIPO Backend Development Guide

**Version:** 2.0
**Last Updated:** 2026-02-09
**Purpose:** Complete, portable blueprint for building Node.js/Express/TypeScript backend APIs following SHIPO patterns

> **IMPORTANT:** This file contains NO external file references. All code examples are inline and complete. This document can be used as a standalone guide in any project.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Database Migrations](#3-database-migrations)
4. [Module Architecture](#4-module-architecture)
5. [Simple CRUD Example: Customers](#5-simple-crud-example-customers)
6. [Complex Example: ShipmentLegs](#6-complex-example-shipmentlegs-with-status-records-and-files)
7. [File Management Pattern](#7-file-management-pattern)
8. [Development Workflow](#8-development-workflow)
9. [Coding Patterns](#9-coding-patterns)
10. [Permissions System](#10-permissions-system)
11. [API Response Format](#11-api-response-format)
12. [Do's and Don'ts](#12-dos-and-donts)

> **For comprehensive status tracking documentation**, see the companion file: **STATUS_RECORDS_SKILL.md**

---

## 1. Technology Stack

### Core Technologies
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v4.x with Helmet for security
- **Database:** PostgreSQL 12+ with SSL
- **ORM/Query Builder:** Knex.js for migrations + Objection.js for models
- **Authentication:** JWT tokens with bcryptjs password hashing
- **Validation:** Joi with Celebrate middleware
- **File Handling:** express-fileupload + Sharp for image processing
- **Storage:** AWS S3 for file storage
- **Email:** AWS SES
- **Payments:** Stripe integration
- **Timezone:** moment-timezone (default: America/Monterrey)

### Development Tools
- **Dev Server:** ts-node-dev with hot-reload
- **Build:** Babel for TypeScript compilation
- **Testing:** Jest
- **Logging:** Morgan with custom timezone formatting

### Key Dependencies
```json
{
  "express": "^4.x",
  "objection": "^3.x",
  "knex": "^2.x",
  "pg": "^8.x",
  "celebrate": "^15.x",
  "joi": "^17.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "moment-timezone": "^0.5.x",
  "express-fileupload": "^1.x",
  "aws-sdk": "^2.x"
}
```

---

## 2. Project Structure

### Directory Layout
```
/project-root/
├── src/
│   ├── Api/                    # API endpoints (numbered modules)
│   │   ├── 001_Countries/
│   │   ├── 002_Cities/
│   │   ├── 003_Authentication/
│   │   ├── 004_Users/
│   │   ├── 007_Customers/      # ✅ Simple CRUD example
│   │   ├── 011_ShipmentLegs/   # ✅ Complex example with status + files
│   │   │   ├── 001_ShipmentLegStatuses/
│   │   │   │   └── 001_ShipmentLegStatusRecords/
│   │   │   ├── 002_ShipmentLegFiles/
│   │   │   ├── shipmentLegs.model.ts
│   │   │   ├── shipmentLegs.controller.ts
│   │   │   ├── shipmentLegs.queries.ts
│   │   │   ├── shipmentLegs.validations.ts
│   │   │   └── shipmentLegs.routes.ts
│   │   └── [other modules...]
│   ├── Config/                 # Configuration files
│   │   ├── Db.config.ts
│   │   └── Server.config.ts
│   ├── Middlewares/            # Express middleware
│   │   ├── Error.mw.ts
│   │   ├── ErrorHandler.mw.ts
│   │   ├── Validations.mw.ts
│   │   └── 001_Permissions.mw.ts/
│   ├── Services/               # Business logic utilities
│   │   ├── Index.services.ts
│   │   ├── Storage.services.ts
│   │   ├── Mail.service.ts
│   │   └── Moment.services.ts
│   ├── Utils/                  # Utility functions
│   │   ├── SuccessMessage.util.ts
│   │   └── ErrorMessages.util.ts
│   ├── knexfile.ts            # Knex configuration
│   └── server.ts              # Application entry point
├── knex/
│   └── db/
│       ├── migrations/         # Database migrations
│       └── seeds/              # Database seeds
├── dist/                       # Compiled JavaScript (build output)
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

### Module Numbering Convention
API modules use numeric prefixes for logical ordering:
- `001_` - Foundation (Countries, Cities)
- `002-004_` - Authentication & Users
- `005-010_` - Core entities (Enterprises, Customers, Employees)
- `011-020_` - Logistics (Shipments, Legs, Orders)
- `021+` - Supporting features (Payments, Invoices, Reports)

---

## 3. Database Migrations

### Migration File Naming
Migrations are numbered for execution order:
```
2016_Customers.ts
2029_ShipmentLegs.ts
2030_ShipmentLegStatuses.ts
2031_ShipmentLegStatusRecords.ts
```

### Migration Template
```typescript
import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('TableName', (table: any) => {
            // Primary Key
            table.uuid('sTableNameId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();

            // Foreign Keys
            table.uuid('sEnterpriseId').references('sEnterpriseId').inTable('Enterprises');

            // Data Fields (Hungarian notation)
            table.string('sName').defaultTo('');                    // s = string
            table.text('sDescription').defaultTo('');               // text for longer strings
            table.boolean('bActive').defaultTo(true);               // b = boolean
            table.integer('iCount').defaultTo(0);                   // i = integer
            table.decimal('dAmount', 25, 2).defaultTo(0);          // d = decimal
            table.timestamp('tCreatedAt').defaultTo(null);          // t = timestamp

            // Audit Fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);  // created_at, updated_at

            // Indexes
            table.index(['sEnterpriseId'], 'TableName_sEnterpriseId_idx');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('TableName');
}
```

### Hungarian Notation for Database Columns

| Prefix | Type | PostgreSQL Type | Example |
|--------|------|----------------|---------|
| `s` | String | VARCHAR/TEXT | `sName`, `sEmail` |
| `b` | Boolean | BOOLEAN | `bActive`, `bHasCredit` |
| `i` | Integer | INTEGER | `iCount`, `iCreditDays` |
| `d` | Decimal | DECIMAL(25,2) or DECIMAL(31,15) | `dAmount`, `dRate` |
| `t` | Timestamp | TIMESTAMP | `tCreatedAt`, `tDeliveryDate` |
| `a` | Array | N/A (TypeScript/validation) | `aCustomerContacts` |

**Important Rules:**
- Primary keys: Always UUID with pattern `s{TableName}Id` (e.g., `sCustomerId`)
- Foreign keys: Match the referenced table's primary key name exactly
- Monetary values: Use `DECIMAL(25, 2)` for currency amounts
- High-precision decimals: Use `DECIMAL(31, 15)` for rates/percentages
- Text fields: Use `TEXT` for unlimited length, `VARCHAR` for limited
- Default values: Always provide sensible defaults
- Soft deletes: Use `bActive` boolean flag (defaults to `true`)

### Migration Commands
```bash
# Run pending migrations
npm run db:migrations

# Rollback last batch
npm run db:rollback

# Run seeds
npm run db:seeds
```

---

## 4. Module Architecture

### Standard Module Structure
Each module follows this pattern:
```
ModuleName/
├── moduleName.model.ts        # Objection.js model with relations
├── moduleName.controller.ts   # Request handlers with business logic
├── moduleName.queries.ts      # Database queries (Objection/Knex)
├── moduleName.validations.ts  # Joi validation schemas
├── moduleName.routes.ts       # Express routes
└── SubModules/                # Nested resources (optional)
    ├── 001_SubModule1/
    └── 002_SubModule2/
```

### File Responsibilities

| File | Purpose | Contains |
|------|---------|----------|
| **model.ts** | Data model definition | Objection.js Model class, interface, relations, hooks |
| **controller.ts** | Request handling | async functions `(req, res, next)`, call queries, return responses |
| **queries.ts** | Database operations | Static class with query methods using Objection.js |
| **validations.ts** | Input validation | Joi schemas for body/params/query validation |
| **routes.ts** | Route definitions | Express Router with endpoints, middleware, validation |

### Route URL Pattern
```
{env}/api/v1/:sLang/{module}/{:id?}/{submodule?}
```

**Example URLs:**
```
/api/v1/en/customers                    # GET all customers
/api/v1/es/customers/:sCustomerId       # GET one customer
/api/v1/en/shipmentLegs/:sShipmentLegId/statusRecords  # Nested resource
```

**URL Parameters:**
- `:sLang` - Language code (`en` or `es`)
- Multi-tenant isolation via `sEnterpriseId` in `res.locals`
- Authentication via `sUserId` in `res.locals`

---

## 5. Simple CRUD Example: Customers

The Customers module demonstrates standard CRUD operations without complex status tracking or file management.

### 5.1 Customer Migration (2016_Customers.ts)

```typescript
import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('Customers', (table: any) => {
            table.uuid('sCustomerId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sEnterpriseId').references('sEnterpriseId').inTable('Enterprises');
            table.uuid('sCountryId').references('sCountryId').inTable('Countries');
            table.string('sFolio').defaultTo('');
            table.string('sCommercialName').defaultTo('');
            table.string('sCommercialAddress').defaultTo('');
            table.string('sIndustry').defaultTo('');
            table.string('sWebPage').defaultTo('');
            table.decimal('dAnnualRevenue', 25, 2).defaultTo(null);

            // Credit options
            table.boolean('bHasCredit').defaultTo(null);
            table.integer('iCreditDays').defaultTo(0);

            // Bank info
            table.string('sBankName').defaultTo('');
            table.string('sBankReference').defaultTo('');
            table.string('sClabeNumber').defaultTo('');

            // Account owner (which employee manages this customer)
            table.uuid('sAccountOwnerId').references('sEmployeeId').inTable('Employees');

            // Audit fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);

            table.index(['sEnterpriseId'], 'Customers_sEnterpriseId_idx');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('Customers');
}
```

**Key Patterns:**
- UUID primary key with `uuid_generate_v4()`
- Foreign keys to related entities
- Hungarian notation for all columns
- Monetary field uses `DECIMAL(25, 2)`
- Soft delete via `bActive` flag
- Audit trail with `sCreatedBy` and `sLastUpdatedBy`
- Automatic timestamps via Knex

### 5.2 Customer Model (customers.model.ts)

```typescript
import { Model, RelationMappings } from 'objection';
import { db } from '../../Config/Db.config';
import { UsersModel } from '../004_Users/users.model';
import { CountriesModel } from '../001_Countries/countries.model';
import { EmployeesModel } from '../008_Employees/employees.model';
import * as MomentServices from '../../Services/Moment.services';

Model.knex(db);

export interface ICustomers {
    sCustomerId?: string;
    sEnterpriseId?: string;
    sCountryId?: string;
    sFolio?: string;
    sCommercialName?: string;
    sCommercialAddress?: string;
    sIndustry?: string;
    sWebPage?: string;
    dAnnualRevenue?: number;
    bHasCredit?: boolean;
    iCreditDays?: number;
    sBankName?: string;
    sBankReference?: string;
    sClabeNumber?: string;
    sAccountOwnerId?: string;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class CustomersModel extends Model implements ICustomers {
    public sCustomerId?: string;
    public sEnterpriseId?: string;
    public sCountryId?: string;
    public sFolio?: string;
    public sCommercialName?: string;
    public sCommercialAddress?: string;
    public sIndustry?: string;
    public sWebPage?: string;
    public dAnnualRevenue?: number;
    public bHasCredit?: boolean;
    public iCreditDays?: number;
    public sBankName?: string;
    public sBankReference?: string;
    public sClabeNumber?: string;
    public sAccountOwnerId?: string;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public bActive?: boolean;
    public formattedCreatedAt?: string;
    public formattedUpdatedAt?: string;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'Customers';
    static idColumn: string = 'sCustomerId';

    static relationMappings: RelationMappings = {
        Country: {
            relation: Model.BelongsToOneRelation,
            modelClass: CountriesModel,
            join: {
                from: 'Customers.sCountryId',
                to: 'Countries.sCountryId'
            }
        },
        AccountOwner: {
            relation: Model.BelongsToOneRelation,
            modelClass: EmployeesModel,
            join: {
                from: 'Customers.sAccountOwnerId',
                to: 'Employees.sEmployeeId'
            }
        },
        CreatedByUser: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'Customers.sCreatedBy',
                to: 'Users.sUserId'
            }
        },
        LastUpdatedByUser: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'Customers.sLastUpdatedBy',
                to: 'Users.sUserId'
            }
        }
    };

    async $beforeInsert() {
        this.created_at = new Date();
    }

    async $beforeUpdate() {
        this.updated_at = new Date();
    }

    async $afterFind() {
        if (this.created_at) {
            this.formattedCreatedAt = MomentServices.FormatDateWithHoursUTCSix(this.created_at);
        }
        if (this.updated_at) {
            this.formattedUpdatedAt = MomentServices.FormatDateWithHoursUTCSix(this.updated_at);
        }
    }
}
```

**Model Patterns:**
- TypeScript interface matching database columns
- Class extends Objection `Model`
- `tableName` and `idColumn` static properties
- Relations: `BelongsToOneRelation`, `HasManyRelation`, etc.
- Lifecycle hooks: `$beforeInsert`, `$beforeUpdate`, `$afterFind`
- Formatted dates added in `$afterFind` for timezone-adjusted display

### 5.3 Customer Validations (customers.validations.ts)

```typescript
import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateCustomerBody = Validations.JoiObjectKeys({
    sCountryId: Validations.UUID("Customers sCountryId"),
    sCommercialName: Validations.RequiredString("Customers sCommercialName"),
    sCommercialAddress: Validations.String("Customers sCommercialAddress"),
    sIndustry: Validations.String("Customers sIndustry"),
    sWebPage: Validations.String("Customers sWebPage"),
    dAnnualRevenue: Validations.PositiveMonetaryValue("Customers dAnnualRevenue"),
    bHasCredit: Validations.RequiredBoolean("Customers bHasCredit"),
    iCreditDays: Validations.PositiveInteger("Customers iCreditDays"),

    // Nested array of contact objects
    aCustomerContacts: Joi.array().items(
        Joi.object({
            sFullName: Validations.RequiredString("CustomerContacts sFullName"),
            sPhoneNumber: Validations.String("CustomerContacts sPhoneNumber"),
            sPhoneExtension: Validations.String("CustomerContacts sPhoneExtension"),
            sEmail: Validations.CorrectEmail("CustomerContacts sEmail"),
            sType: Validations.String("CustomerContacts sType")
        })
    ).error(new Error("Customers aCustomerContacts")),

    sFiscalRegime: Validations.String("Customers sFiscalRegime"),
    sFiscalCompanyName: Validations.String("Customers sFiscalCompanyName"),
    sRFC: Validations.String("Customers sRFC"),
    sTaxAddress: Validations.String("Customers sTaxAddress"),
    sTaxZipCode: Validations.String("Customers sTaxZipCode"),
    sBankName: Validations.String("Customers sBankName"),
    sBankReference: Validations.String("Customers sBankReference"),
    sClabeNumber: Validations.String("Customers sClabeNumber"),
    sAccountOwnerId: Validations.UUID("Employees sEmployeeId")
});

export const GetCustomersQuery = Validations.JoiObjectKeys({
    bDropdown: Validations.Boolean("Filters bDropdown"),
    ...Validations.Filters  // Includes iPageNumber, iItemsPerPage, sSearch
});

export const GetCustomerParams = Validations.JoiObjectKeys({
    sCustomerId: Validations.RequiredUUID("Customers sCustomerId"),
});

export const UpdateCustomerParams = Validations.JoiObjectKeys({
    sCustomerId: Validations.RequiredUUID("Customers sCustomerId"),
});

export const UpdateCustomerBody = Validations.JoiObjectKeys({
    sCountryId: Validations.UUID("Customers sCountryId"),
    sCommercialName: Validations.RequiredString("Customers sCommercialName"),
    sCommercialAddress: Validations.String("Customers sCommercialAddress"),
    sIndustry: Validations.String("Customers sIndustry"),
    sWebPage: Validations.String("Customers sWebPage"),
    dAnnualRevenue: Validations.PositiveMonetaryValue("Customers dAnnualRevenue"),
    bHasCredit: Validations.RequiredBoolean("Customers bHasCredit"),
    iCreditDays: Validations.PositiveInteger("Customers iCreditDays"),
    sBankName: Validations.String("Customers sBankName"),
    sBankReference: Validations.String("Customers sBankReference"),
    sClabeNumber: Validations.String("Customers sClabeNumber"),
    sAccountOwnerId: Validations.UUID("Employees sEmployeeId")
});

export const DeleteCustomerParams = Validations.JoiObjectKeys({
    sCustomerId: Validations.RequiredUUID("Customers sCustomerId"),
});
```

**Validation Patterns:**
- All validation schemas use Celebrate + Joi
- Reusable validation functions from middleware
- Separate schemas for: CreateBody, UpdateBody, GetParams, GetQuery, DeleteParams
- Error messages include field name for debugging
- Nested object validation with `Joi.array().items(Joi.object({...}))`
- Standard filters: `iPageNumber`, `iItemsPerPage`, `sSearch`

**Common Validation Functions:**
- `RequiredUUID()` - Required UUID field
- `UUID()` - Optional UUID field
- `RequiredString()` - Required non-empty string
- `String()` - Optional string
- `RequiredBoolean()` - Required boolean
- `Boolean()` - Optional boolean
- `PositiveInteger()` - Integer >= 0
- `PositiveMonetaryValue()` - Decimal >= 0 for currency
- `CorrectEmail()` - Valid email format

### 5.4 Customer Queries (customers.queries.ts)

```typescript
import { CustomersModel } from './customers.model';
import { CustomerContactsModel } from './001_CustomerContacts/customerContacts.model';
import { TaxEntitiesModel } from '../015_TaxEntities/taxEntities.model';

class Queries {
    constructor() {};

    // Verify customer exists and belongs to enterprise
    static async verifyCustomerExistsByEnterprise(sEnterpriseId, sCustomerId) {
        return await CustomersModel.query()
            .findById(sCustomerId)
            .where('sEnterpriseId', sEnterpriseId)
            .where('bActive', true);
    }

    // Insert customer with nested contacts and tax entity
    static async insertCustomer({sEnterpriseId, aCustomerContacts, sUserId, customerBody}) {
        const {
            sFiscalRegime,
            sFiscalCompanyName,
            sRFC,
            sTaxAddress,
            sTaxZipCode,
            ...cleanCustomerBody
        } = customerBody;

        return await CustomersModel.transaction(async (trx) => {
            // Create customer with nested contacts
            const newCustomer = await CustomersModel.query(trx).insertGraph({
                sEnterpriseId,
                CustomerContacts: aCustomerContacts,
                ...cleanCustomerBody,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId
            }).returning('*');

            // Create tax entity if tax info provided
            const hasTaxInfo = sFiscalRegime || sFiscalCompanyName || sRFC;
            if (hasTaxInfo) {
                await TaxEntitiesModel.query(trx).insert({
                    sEnterpriseId,
                    sCustomerId: newCustomer.sCustomerId,
                    sFiscalRegime: sFiscalRegime || '',
                    sFiscalCompanyName: sFiscalCompanyName || '',
                    sRFC: sRFC || '',
                    sTaxAddress: sTaxAddress || '',
                    sTaxZipCode: sTaxZipCode || '',
                    bDefault: true,
                    sCreatedBy: sUserId,
                    sLastUpdatedBy: sUserId
                });
            }

            return newCustomer;
        });
    }

    // Update customer
    static async updateCustomer(sCustomerId, {sUserId, customerBody}) {
        return await CustomersModel.query()
            .patchAndFetchById(sCustomerId, {
                ...customerBody,
                sLastUpdatedBy: sUserId
            })
            .where('bActive', true);
    }

    // Find all customers with pagination and search
    static async findAllCustomersByEnterprise(sEnterpriseId, iPageNumber, iItemsPerPage, sSearch) {
        return await CustomersModel.query().modify(function (queryBuilder: any) {
            queryBuilder.select('Customers.*')
            queryBuilder.select('Country.sName AS sCountryName')
            queryBuilder.where('Customers.bActive', true)
            queryBuilder.where('Customers.sEnterpriseId', sEnterpriseId)
            queryBuilder.leftJoinRelated('Country')

            // Eager load relations
            queryBuilder.withGraphFetched('CreatedByUser').modifyGraph('CreatedByUser', builder => {
                builder.select('sName', 'sLastName', 'sEmail');
            })
            queryBuilder.withGraphFetched('LastUpdatedByUser').modifyGraph('LastUpdatedByUser', builder => {
                builder.select('sName', 'sLastName', 'sEmail');
            })
            queryBuilder.withGraphFetched('AccountOwner').modifyGraph('AccountOwner', builder => {
                builder.select('sEmployeeId', 'sName', 'sLastName', 'sEmail');
            })

            // Search with unaccent for international characters
            if (sSearch) {
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("Customers"."sCommercialName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Customers"."sFolio") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }

            queryBuilder.orderBy('Customers.sCommercialName', 'asc')
            queryBuilder.page((iPageNumber - 1), iItemsPerPage)
        })
    }

    // Get one customer
    static async findOneCustomerByEnterprise(sEnterpriseId, sCustomerId) {
        return await CustomersModel.query()
            .findById(sCustomerId)
            .where('Customers.bActive', true)
            .where('Customers.sEnterpriseId', sEnterpriseId)
            .withGraphFetched('Country')
            .withGraphFetched('AccountOwner')
            .withGraphFetched('CreatedByUser')
            .withGraphFetched('LastUpdatedByUser');
    }

    // Soft delete customer
    static async deleteCustomer(sCustomerId) {
        return await CustomersModel.transaction(async (trx) => {
            const deletedCustomer = await CustomersModel.query(trx)
                .patchAndFetchById(sCustomerId, { bActive: false })
                .where('bActive', true);

            // Cascade soft delete to contacts
            await CustomerContactsModel.query(trx)
                .patch({ bActive: false })
                .where('sCustomerId', sCustomerId)
                .where('bActive', true);

            // Cascade soft delete to tax entities
            await TaxEntitiesModel.query(trx)
                .patch({ bActive: false })
                .where('sCustomerId', sCustomerId)
                .where('bActive', true);

            return {customer: deletedCustomer};
        });
    }

    // Count customers for folio generation
    static async countAllCreatedCustomersByEnterprise(sEnterpriseId: string) {
        const result = await CustomersModel.query()
            .where('sEnterpriseId', sEnterpriseId)
            .count('sCustomerId as count')
            .first();
        return parseInt(result?.count ?? '0');
    }
}

export default Queries;
```

**Query Patterns:**
- Static class with query methods
- All queries filter by `bActive = true`
- Multi-tenant: Always filter by `sEnterpriseId`
- Transactions for multi-table operations
- `insertGraph()` for nested inserts (contacts)
- `withGraphFetched()` for eager loading relations
- `modifyGraph()` to customize related data selection
- Pagination with `.page(offset, limit)`
- Search with `unaccent()` for international characters
- `patchAndFetchById()` returns updated record
- Cascade soft deletes to related records

### 5.5 Customer Controller (customers.controller.ts)

```typescript
import { Response, Request, NextFunction } from 'express';
import CustomerQueries from './customers.queries';
import CountriesQueries from '../001_Countries/countries.queries';
import EmployeeQueries from '../008_Employees/employees.queries';
import MyError from '../../Middlewares/Error.mw';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';
import Services from '../../Services/Index.services';

class Controllers {
    // Create customer
    async createCustomer(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sEnterpriseId, sUserId} = res.locals;
        var {sCountryId, aCustomerContacts, sAccountOwnerId, ...customerData} = req.body;

        // Validate country exists
        if (sCountryId) {
            const myCountry = await CountriesQueries.verifyCountryExists(sCountryId);
            if (!myCountry) {
                return next(new MyError(404, ErrorMessages.Countries.notFound[sLang]));
            }
        } else {
            sCountryId = null;
        }

        // Process contacts array
        let arrProcessedCustomerContacts = [];
        if (aCustomerContacts) {
            arrProcessedCustomerContacts = aCustomerContacts.map(contact => ({
                ...contact,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId
            }));
        }

        // Validate account owner
        if (sAccountOwnerId) {
            const myEmployee = await EmployeeQueries.verifyEmployeeExistsWithEnterpriseUser(sEnterpriseId, sAccountOwnerId);
            if (!myEmployee) {
                return next(new MyError(404, ErrorMessages.Employees.notFound[sLang]));
            }
        } else {
            sAccountOwnerId = null;
        }

        // Generate folio
        let iCustomerCount = await CustomerQueries.countAllCreatedCustomersByEnterprise(sEnterpriseId);
        req.body.sFolio = await Services.generateFolio('CUS', iCustomerCount);

        // Create customer
        delete req.body.aCustomerContacts;
        var newCustomer = await CustomerQueries.insertCustomer({
            sEnterpriseId,
            sUserId,
            aCustomerContacts: arrProcessedCustomerContacts,
            customerBody: req.body
        });

        return res.status(201).json({
            message: SuccessMessages.Customers.createCustomer[sLang],
            customer: newCustomer,
        });
    }

    // Update customer
    async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sEnterpriseId, sUserId} = res.locals;
        const {sCustomerId} = req.params;
        var {sCountryId, sAccountOwnerId, ...customerData} = req.body;

        // Verify customer exists
        const myCustomer = await CustomerQueries.verifyCustomerExistsByEnterprise(sEnterpriseId, sCustomerId);
        if (!myCustomer) {
            return next(new MyError(404, ErrorMessages.Customers.notFound[sLang]));
        }

        // Validate foreign keys if provided
        if (sCountryId) {
            const myCountry = await CountriesQueries.verifyCountryExists(sCountryId);
            if (!myCountry) {
                return next(new MyError(404, ErrorMessages.Countries.notFound[sLang]));
            }
        }

        if (sAccountOwnerId) {
            const myEmployee = await EmployeeQueries.verifyEmployeeExistsWithEnterpriseUser(sEnterpriseId, sAccountOwnerId);
            if (!myEmployee) {
                return next(new MyError(404, ErrorMessages.Employees.notFound[sLang]));
            }
        }

        // Update customer
        const updatedCustomer = await CustomerQueries.updateCustomer(sCustomerId, {
            sUserId,
            customerBody: req.body
        });

        return res.status(201).json({
            message: SuccessMessages.Customers.updateCustomer[sLang],
            customer: updatedCustomer,
            success: true
        });
    }

    // Get ALL customers
    async getAllCustomers(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sEnterpriseId, sUserId} = res.locals;
        const {iPageNumber, iItemsPerPage, sSearch} = req.query;

        const myCustomers = await CustomerQueries.findAllCustomersByEnterprise(
            sEnterpriseId, iPageNumber, iItemsPerPage, sSearch
        );

        const iNumPages = Math.ceil(myCustomers.total / Number(iItemsPerPage));

        return res.status(201).json({
            message: SuccessMessages.Customers.getAllCustomers[sLang],
            customers: myCustomers.results,
            iTotal: myCustomers.total,
            iNumPages: iNumPages,
            success: true
        });
    }

    // Get ONE customer
    async getOneCustomer(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sEnterpriseId} = res.locals;
        const {sCustomerId} = req.params;

        const myCustomer = await CustomerQueries.findOneCustomerByEnterprise(sEnterpriseId, sCustomerId);
        if (!myCustomer) {
            return next(new MyError(404, ErrorMessages.Customers.notFound[sLang]));
        }

        return res.status(201).json({
            message: SuccessMessages.Customers.getOneCustomer[sLang],
            customer: myCustomer,
            success: true
        });
    }

    // Delete customer
    async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sEnterpriseId} = res.locals;
        const {sCustomerId} = req.params;

        const myCustomer = await CustomerQueries.verifyCustomerExistsByEnterprise(sEnterpriseId, sCustomerId);
        if (!myCustomer) {
            return next(new MyError(404, ErrorMessages.Customers.notFound[sLang]));
        }

        await CustomerQueries.deleteCustomer(sCustomerId);

        return res.status(201).json({
            message: SuccessMessages.Customers.deleteCustomer[sLang],
            success: true
        });
    }
}

export default new Controllers();
```

**Controller Patterns:**
- Extract `sLang`, `sEnterpriseId`, `sUserId` from `res.locals`
- Validate all foreign key references exist before insert/update
- Use `next(new MyError(statusCode, message))` for errors
- Return success with status 201 and localized message
- Generate folios before creation (e.g., "CUS-00001")
- Set null for optional foreign keys when not provided
- Always verify enterprise ownership before operations

### 5.6 Customer Routes (customers.routes.ts)

```typescript
import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import CustomerController from './customers.controller';
import * as CustomerValidations from './customers.validations';
import { verifyEnterpriseUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/enterprises.permissions';

const router = Router({mergeParams: true});

// Create
router.post('/',
    celebrate({ body: CustomerValidations.CreateCustomerBody }),
    aH(verifyEnterpriseUserPermissions([{sModuleName: 'Customers', sActionCode: 'WRITE'}])),
    aH(CustomerController.createCustomer));

// Update
router.put('/:sCustomerId',
    celebrate({
        params: CustomerValidations.UpdateCustomerParams,
        body: CustomerValidations.UpdateCustomerBody
    }),
    aH(verifyEnterpriseUserPermissions([{sModuleName: 'Customers', sActionCode: 'WRITE'}])),
    aH(CustomerController.updateCustomer));

// Get ALL
router.get('/',
    celebrate({ query: CustomerValidations.GetCustomersQuery }),
    aH(verifyEnterpriseUserPermissions([{sModuleName: 'Customers', sActionCode: 'READ'}])),
    aH(CustomerController.getAllCustomers));

// Get ONE
router.get('/:sCustomerId',
    celebrate({ params: CustomerValidations.GetCustomerParams }),
    aH(verifyEnterpriseUserPermissions([{sModuleName: 'Customers', sActionCode: 'READ'}])),
    aH(CustomerController.getOneCustomer));

// Delete
router.delete('/:sCustomerId',
    celebrate({ params: CustomerValidations.DeleteCustomerParams }),
    aH(verifyEnterpriseUserPermissions([{sModuleName: 'Customers', sActionCode: 'WRITE'}])),
    aH(CustomerController.deleteCustomer));

export default router;
```

**Route Patterns:**
- Use `express-async-handler` (`aH`) to catch async errors
- Celebrate middleware for validation (executes before controller)
- Permission middleware checks module + action code
- RESTful endpoints: POST, GET, PUT, DELETE
- Nested routes use `{mergeParams: true}`

---

## 6. Complex Example: ShipmentLegs with Status Records and Files

ShipmentLegs demonstrates:
1. **Status Tracking** - State machine with adjacency validation
2. **Status Records** - Historical timeline of status changes
3. **File Management** - Document uploads (POD, invoices, etc.)
4. **Complex Business Logic** - Rate tracking, payment calculations, cascade updates

> **For comprehensive status tracking patterns**, see **STATUS_RECORDS_SKILL.md**

### 6.1 ShipmentLeg Migrations

#### 2029_ShipmentLegs.ts

```typescript
import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('ShipmentLegs', (table: any) => {
            table.uuid('sShipmentLegId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sShipmentId').references('sShipmentId').inTable('Shipments');
            table.uuid('sLegId').references('sLegId').inTable('Legs');
            table.uuid('sCarrierLaneId').references('sCarrierLaneId').inTable('CarrierLanes');

            // Rate tracking - carrier side
            table.decimal('dShipmentLegCarrierLaneRate', 25, 2).defaultTo(0);
            table.decimal('dShipmentLegCarrierLaneRateOriginal', 25, 2).defaultTo(0);
            table.integer('iShipmentLegCarrierLaneRateAdjustmentCount').defaultTo(0);
            table.decimal('dShipmentLegCarrierLaneRateAdjustmentAmount', 25, 2).defaultTo(0);

            // POD tracking
            table.enum('sPODStatus', ['NOT UPLOADED', 'PENDING', 'APPROVED', 'DECLINED'])
                .defaultTo('NOT UPLOADED');
            table.timestamp('tPODUpdatedAt').defaultTo(null);
            table.uuid('sPODUpdatedBy').references('sUserId').inTable('Users').nullable();

            // Real delivery timestamp (set when status = Delivered)
            table.timestamp('tRealDeliveryDate').defaultTo(null);

            table.string('sFolio').defaultTo('');
            table.text('sComments').defaultTo('');

            // Audit fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);

            table.index(['sShipmentId'], 'ShipmentLegs_sShipmentId_idx');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('ShipmentLegs');
}
```

#### 2030_ShipmentLegStatuses.ts

```typescript
import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('ShipmentLegStatuses', (table: any) => {
            table.uuid('sShipmentLegStatusId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.string('sStatusNameSP').defaultTo('');  // Spanish name
            table.string('sStatusNameEN').defaultTo('');  // English name
            table.string('sColorHex').defaultTo('#000000');
            table.integer('iOrder').defaultTo(0);

            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('ShipmentLegStatuses');
}
```

#### 2031_ShipmentLegStatusRecords.ts

```typescript
import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('ShipmentLegStatusRecords', (table: any) => {
            table.uuid('sShipmentLegStatusRecordId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();
            table.uuid('sShipmentLegId').references('sShipmentLegId').inTable('ShipmentLegs');
            table.uuid('sShipmentLegStatusId').references('sShipmentLegStatusId').inTable('ShipmentLegStatuses');
            table.text('sComments').defaultTo('');

            // Location tracking
            table.string('sLatitude').defaultTo('');
            table.string('sLongitude').defaultTo('');

            // Record date (defaults to created_at if not provided)
            table.timestamp('tRecordDate').defaultTo(null);

            // Audit fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);

            table.index(['sShipmentLegId'], 'ShipmentStatusRecords_sShipmentLegId_idx');
        })
}

export async function down(Knex): Promise<void> {
    return Knex.schema.dropTable('ShipmentLegStatusRecords');
}
```

**Migration Patterns:**
- Status lookup table stores available statuses
- StatusRecords table stores historical timeline
- POD status enum for document approval workflow
- Timestamps for delivery tracking (`tRealDeliveryDate`)
- Location tracking with latitude/longitude

### 6.2 Status Adjacency Definition (shipmentLegStatusAdjacency.ts)

```typescript
// Simplified version for validation (just IDs)
export const ShipmentLegStatusTransitions: { [key: string]: string[] } = {
    'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba': ['115be908-edfe-420a-aa78-a18516c9d306'],  // PreShipment -> Cancelled
    '53fb3937-a7ea-4cf3-9454-3b15cad55e60': ['ef903880-5c92-490f-b5fc-1ceafdd091f5', '115be908-edfe-420a-aa78-a18516c9d306'],  // Scheduled -> Loading, Cancelled
    'ef903880-5c92-490f-b5fc-1ceafdd091f5': ['85e4bdea-6ff1-43c7-9cd0-f5bb4b65fc74', '115be908-edfe-420a-aa78-a18516c9d306'],  // Loading -> On Transit, Cancelled
    '85e4bdea-6ff1-43c7-9cd0-f5bb4b65fc74': ['8253af08-6800-461d-9662-48237f5d42f6', '115be908-edfe-420a-aa78-a18516c9d306'],  // On Transit -> Delivered, Cancelled
    '8253af08-6800-461d-9662-48237f5d42f6': [],  // Delivered (terminal state)
    '115be908-edfe-420a-aa78-a18516c9d306': []   // Cancelled (terminal state)
};

// Visual version with full details for UI display
export const ShipmentLegStatusTransitionsVisual: { [key: string]: Array<{...}> } = {
    // PreShipment can only go to Cancelled
    'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba': [
        {
            sShipmentLegStatusId: '115be908-edfe-420a-aa78-a18516c9d306',
            sStatusNameSP: 'Cancelada',
            sStatusNameEN: 'Cancelled',
            iOrder: 99,
            sColorHex: '#ff0000'
        }
    ],
    // ... more visual mappings
};
```

**Status Adjacency Patterns:**
- Two exports: Visual (with full details) and simplified (validation only)
- Visual version used for UI to show available next statuses
- Simplified version used in controller to validate transitions
- Empty array `[]` means terminal state (no further transitions)
- Each status ID maps to array of allowed next status IDs

### 6.3 Status Records Controller Pattern

```typescript
// Create ShipmentLegStatusRecord
async createShipmentLegStatusRecord(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
    const {sLang, sUserId, sEnterpriseId} = res.locals;
    const {sShipmentLegId} = req.params;
    const {sShipmentLegStatusId, sComments, sLatitude, sLongitude, tRecordDate} = req.body;

    // Verify shipment leg exists
    const myShipmentLeg = await ShipmentLegQueries.verifyShipmentLegExistsByEnterprise(sEnterpriseId, sShipmentLegId);
    if (!myShipmentLeg) {
        return next(new MyError(404, ErrorMessages.ShipmentLegs.notFound[sLang]));
    }

    // Verify the status exists
    const myShipmentLegStatus = await ShipmentLegStatusRecordsQueries.verifyShipmentLegStatusExists(sShipmentLegStatusId);
    if (!myShipmentLegStatus) {
        return next(new MyError(404, ErrorMessages.ShipmentLegStatuses.notFound[sLang]));
    }

    // Get current status
    const myCurrentStatus = await ShipmentLegStatusRecordsQueries.findCurrentStatusByShipmentLeg(sShipmentLegId);

    // If no current status, first status must be PreShipment
    if (!myCurrentStatus) {
        if (sShipmentLegStatusId !== 'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba') {
            return next(new MyError(400, ErrorMessages.ShipmentLegStatuses.mustBePreShipment[sLang]));
        }
    }

    // Get available next statuses from adjacency map
    var arrAvailableNextStatuses = ShipmentLegStatusTransitions[myCurrentStatus?.ShipmentLegStatus?.sShipmentLegStatusId] || [];

    // Validate transition is allowed
    if (myCurrentStatus && !arrAvailableNextStatuses.includes(sShipmentLegStatusId)) {
        return next(new MyError(404, ErrorMessages.ShipmentLegStatuses.invalidStatus[sLang]));
    }

    // Insert status record (triggers cascade logic in queries)
    const newShipmentLegStatusRecord = await ShipmentLegStatusRecordsQueries.insertShipmentLegStatusRecord({
        sShipmentLegId,
        sShipmentLegStatusId,
        sComments,
        sLatitude,
        sLongitude,
        tRecordDate,
        sCreatedBy: sUserId,
        sLastUpdatedBy: sUserId
    });

    return res.status(201).json({
        message: SuccessMessages.ShipmentLegStatusRecords.createShipmentLegStatusRecord[sLang],
        shipmentLegStatusRecord: newShipmentLegStatusRecord,
    });
}
```

**Status Record Controller Patterns:**
- Get current status before allowing new status creation
- Validate first status must be initial state (PreShipment)
- Check adjacency map to validate transition is allowed
- Pass location data (latitude/longitude) for GPS tracking
- Allow custom `tRecordDate` or default to current time
- Insert triggers cascade logic (updates parent Shipment status)

> **For complete status record cascade logic**, see **STATUS_RECORDS_SKILL.md**

---

## 7. File Management Pattern

Files are managed through join tables that link files to entities.

### 7.1 ShipmentLegFiles Model

```typescript
import { Model, RelationMappings } from 'objection';
import { db } from '../../../Config/Db.config';
import { ShipmentLegsModel } from '../shipmentLegs.model';
import { FilesModel } from '../../009_Files/files.model';

Model.knex(db);

export interface IShipmentLegFile {
    sShipmentLegFileId?: string;
    sShipmentLegId?: string;
    sType?: string;  // 'POD', 'INVOICE', 'EVIDENCE', etc.
}

export class ShipmentLegFilesModel extends Model {
    public sShipmentLegFileId?: string;
    public sShipmentLegId?: string;
    public sType?: string;

    static tableName: string = 'ShipmentLegFiles';
    static idColumn: string = 'sShipmentLegFileId';

    static relationMappings: RelationMappings = {
        ShipmentLeg: {
            relation: Model.BelongsToOneRelation,
            modelClass: ShipmentLegsModel,
            join: {
                from: 'ShipmentLegFiles.sShipmentLegId',
                to: 'ShipmentLegs.sShipmentLegId'
            }
        },
        File: {
            relation: Model.BelongsToOneRelation,
            modelClass: FilesModel,
            join: {
                from: 'ShipmentLegFiles.sShipmentLegFileId',
                to: 'Files.sFileId'
            }
        }
    };
}
```

**File Model Pattern:**
- Join table links entity (ShipmentLeg) to Files table
- Primary key is the file ID itself (dual-purpose)
- `sType` field categorizes files (POD, INVOICE, EVIDENCE, etc.)
- Relations to both parent entity and Files table

### 7.2 File Upload Controller Pattern

```typescript
async createShipmentLegFile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
    const {sLang, sUserId, sEnterpriseId} = res.locals;
    const {sShipmentLegId} = req.params;
    var {sArrShipmentLegFileNames, sArrFileTypes, bUseAsShipmentPOD = false} = req.body;

    const knex = ShipmentLegsModel.knex();

    // Transaction to upload files and update POD status
    const {newFiles} = await knex.transaction(async (trx: Transaction) => {
        // Get uploaded files
        const arrFiles = req.files;
        if (!arrFiles) {
            throw (new MyError(400, ErrorMessages.UploadImages.FileNotFound[sLang]));
        }
        var Upload: any = arrFiles.oFile;

        // Normalize single file to array
        if (!Array.isArray(Upload)) {
            Upload = [Upload];
        }
        if (!Array.isArray(sArrShipmentLegFileNames)) {
            sArrShipmentLegFileNames = [sArrShipmentLegFileNames];
        }
        if (!Array.isArray(sArrFileTypes)) {
            sArrFileTypes = [sArrFileTypes];
        }

        // Validate counts match
        if (Upload.length !== sArrShipmentLegFileNames.length) {
            throw (new MyError(400, ErrorMessages.UploadImages.fileNamesAndFileAmountsNotMatch[sLang]));
        }

        // Verify shipment leg exists
        const myShipmentLeg = await ShipmentLegQueries.verifyShipmentLegExistsByEnterprise(sEnterpriseId, sShipmentLegId);
        if (!myShipmentLeg) {
            throw (new MyError(404, ErrorMessages.ShipmentLegs.notFound[sLang]));
        }

        // Check if POD files are being uploaded
        const hasPODFiles = sArrFileTypes.some(type => type === 'POD');

        // Validate POD can only be uploaded when status = Delivered
        if (hasPODFiles) {
            const currentStatus = await ShipmentLegStatusRecordsQueries.findCurrentStatusByShipmentLeg(sShipmentLegId);
            if (!currentStatus || currentStatus.ShipmentLegStatus?.sShipmentLegStatusId !== '8253af08-6800-461d-9662-48237f5d42f6') {
                throw new MyError(400, ErrorMessages.ShipmentLegFiles.podOnlyForDeliveredShipmentLegs[sLang]);
            }
        }

        let arrFilesObject: Array<{sShipmentLegId: string, sType: string, File: {...}}> = [];

        // Upload files to S3
        for (let iCount = 0; iCount < Upload.length; iCount++) {
            const file = Upload[iCount];
            const uploadResult = await Storage.UploadFile(
                sLang,
                file,
                `${sEnterpriseId}/shipmentLegFiles/${myShipmentLeg.sShipmentLegId}`,
                sArrShipmentLegFileNames[iCount]
            );
            const sFolio = await Services.RandomFolio('DOC');

            arrFilesObject.push({
                sShipmentLegId: myShipmentLeg.sShipmentLegId,
                sType: sArrFileTypes[iCount],
                File: {
                    sFileKey: uploadResult.sFileKey,
                    sFileName: sArrShipmentLegFileNames[iCount],
                    sFileType: uploadResult.sFileType,
                    sFolio: sFolio,
                    sCreatedBy: sUserId,
                    sLastUpdatedBy: sUserId
                }
            });
        }

        // Update POD status if POD files uploaded
        if (hasPODFiles) {
            const newPODStatus = 'PENDING';
            await ShipmentLegQueries.updatePODStatus(sShipmentLegId, newPODStatus, sUserId, trx);
        }

        // Save file records using insertGraph
        const newFiles = await ShipmentLegFilesQueries.insertShipmentLegFiles(arrFilesObject, trx);

        return {newFiles};
    });

    return res.status(201).json({
        message: SuccessMessages.ShipmentLegFiles.createShipmentLegFile[sLang],
        newFiles: newFiles
    });
}
```

**File Upload Patterns:**
- Use `express-fileupload` middleware for multipart uploads
- Accept arrays of files, names, and types
- Normalize single uploads to arrays for consistent processing
- Validate counts match (files, names, types)
- Upload to S3 with path: `{enterpriseId}/{module}/{entityId}/{filename}`
- Generate random folio for each file
- Store file metadata in Files table via nested insertGraph
- Link files to entities via join table
- Update related fields (POD status) when specific file types uploaded
- Use transactions to ensure atomicity

### 7.3 File Queries Pattern

```typescript
// Insert files with nested File records
static async insertShipmentLegFiles(arrFilesObject, trx) {
    return await ShipmentLegFilesModel.query(trx).insertGraph(arrFilesObject, {
        relate: true
    });
}

// Find all files for entity
static async findAllShipmentLegFilesByShipmentLeg(sShipmentLegId, sSearch, sType) {
    return await ShipmentLegFilesModel.query().modify(function (queryBuilder: any) {
        queryBuilder.where('ShipmentLegFiles.sShipmentLegId', sShipmentLegId)

        // Eager load File relation
        queryBuilder.withGraphFetched('[File]').modifyGraph('File', builder => {
            builder.select('*');
        })

        // Filter by type
        if (sType) {
            queryBuilder.where('ShipmentLegFiles.sType', sType);
        }

        // Search by file name
        if (sSearch) {
            queryBuilder.whereRaw(`unaccent("File"."sFileName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%']);
        }

        queryBuilder.orderBy('File.created_at', 'desc');
    });
}

// Delete file
static async deleteShipmentLegFile(sShipmentLegFileId) {
    return await ShipmentLegFilesModel.query().deleteById(sShipmentLegFileId);
    // Note: S3 file deletion handled in controller
}
```

**File Query Patterns:**
- Use `insertGraph` with nested File object
- `relate: true` links existing records
- Eager load File details when fetching list
- Filter by type (POD, INVOICE, etc.)
- Search on file names with unaccent
- Order by creation date descending
- Hard delete (no bActive flag) since files are immutable

---

## 8. Development Workflow

### 8.1 Starting New Module

1. **Plan the schema** - Design tables, relationships, Hungarian notation
2. **Create migration** - Write migration file with correct numbering
3. **Run migration** - `npm run db:migrations`
4. **Create model** - Define interface, class, relations, hooks
5. **Create validations** - Define Joi schemas for all endpoints
6. **Create queries** - Write database query methods
7. **Create controller** - Implement business logic and request handlers
8. **Create routes** - Define Express routes with middleware
9. **Test endpoints** - Use Postman/curl to verify functionality
10. **Add permissions** - Configure module permissions in database

### 8.2 Running the Application

```bash
# Development (hot-reload)
npm run dev

# Build for production
npm run build

# Run production
npm start

# Run migrations
npm run db:migrations

# Rollback migrations
npm run db:rollback

# Run seeds
npm run db:seeds
```

---

## 9. Coding Patterns

### 9.1 Error Handling

```typescript
// Custom error class
import MyError from '../../Middlewares/Error.mw';

// In controller
if (!myCustomer) {
    return next(new MyError(404, ErrorMessages.Customers.notFound[sLang]));
}

// Async handler wraps routes
import aH from 'express-async-handler';
router.get('/', aH(CustomerController.getAllCustomers));
```

### 9.2 Multi-tenancy

```typescript
// Extract from res.locals (set by auth middleware)
const {sEnterpriseId} = res.locals;

// Always filter by enterprise
.where('Customers.sEnterpriseId', sEnterpriseId)
```

### 9.3 Soft Deletes

```typescript
// Never hard delete - use bActive flag
static async deleteCustomer(sCustomerId) {
    return await CustomersModel.query()
        .patchAndFetchById(sCustomerId, { bActive: false })
        .where('bActive', true);
}

// Always filter by bActive
.where('bActive', true)
```

### 9.4 Audit Trail

```typescript
// On insert
sCreatedBy: sUserId,
sLastUpdatedBy: sUserId

// On update
sLastUpdatedBy: sUserId
```

### 9.5 Timestamps

```typescript
// Automatic timestamps in migration
table.timestamps(true, true);

// Hooks in model
async $beforeInsert() {
    this.created_at = new Date();
}

async $beforeUpdate() {
    this.updated_at = new Date();
}

// Format for display
async $afterFind() {
    if (this.created_at) {
        this.formattedCreatedAt = MomentServices.FormatDateWithHoursUTCSix(this.created_at);
    }
}
```

### 9.6 Pagination

```typescript
// In validation
...Validations.Filters

// In query
.page((iPageNumber - 1), iItemsPerPage)

// In response
const iNumPages = Math.ceil(myCustomers.total / Number(iItemsPerPage));
```

### 9.7 Eager Loading Relations

```typescript
// With relations
.withGraphFetched('Country')

// With selected fields
.withGraphFetched('CreatedByUser').modifyGraph('CreatedByUser', builder => {
    builder.select('sName', 'sLastName', 'sEmail');
})

// Multiple relations
.withGraphFetched('[Country, AccountOwner, CreatedByUser]')
```

### 9.8 Search with International Characters

```typescript
// Use unaccent for international characters
if (sSearch) {
    queryBuilder.whereRaw(`unaccent("Customers"."sCommercialName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
}
```

### 9.9 Transactions

```typescript
// Wrap multi-table operations
return await CustomersModel.transaction(async (trx) => {
    const newCustomer = await CustomersModel.query(trx).insert({...});
    await TaxEntitiesModel.query(trx).insert({...});
    return newCustomer;
});
```

### 9.10 Folio Generation

```typescript
// Count existing records
let iCount = await Queries.countAllCreatedByEnterprise(sEnterpriseId);

// Generate folio
req.body.sFolio = await Services.generateFolio('CUS', iCount);
// Result: "CUS-00001", "CUS-00002", etc.
```

---

## 10. Permissions System

### 10.1 Permission Structure

```typescript
{
    sModuleName: 'Customers',
    sActionCode: 'READ'  // READ, WRITE, ADMIN
}
```

### 10.2 Permission Middleware

```typescript
import { verifyEnterpriseUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/enterprises.permissions';

// Single permission
aH(verifyEnterpriseUserPermissions([
    {sModuleName: 'Customers', sActionCode: 'READ'}
]))

// Multiple permissions (OR logic)
aH(verifyEnterpriseUserPermissions([
    {sModuleName: 'Customers', sActionCode: 'READ'},
    {sModuleName: 'Customers', sActionCode: 'WRITE'},
    {sModuleName: 'Customers', sActionCode: 'ADMIN'}
]))
```

### 10.3 Permission Levels

- **READ** - View records
- **WRITE** - Create, update, delete records
- **ADMIN** - Full access including configuration

---

## 11. API Response Format

### 11.1 Success Response

```typescript
return res.status(201).json({
    message: SuccessMessages.Customers.createCustomer[sLang],
    customer: newCustomer,
    success: true
});
```

### 11.2 List Response with Pagination

```typescript
return res.status(201).json({
    message: SuccessMessages.Customers.getAllCustomers[sLang],
    customers: myCustomers.results,
    iTotal: myCustomers.total,
    iNumPages: iNumPages,
    success: true
});
```

### 11.3 Error Response

```typescript
// Handled by ErrorHandler middleware
{
    "statusCode": 404,
    "message": "Customer not found"
}
```

### 11.4 Multi-language Messages

```typescript
// Success messages
SuccessMessages.Customers.createCustomer = {
    en: 'Customer created successfully',
    es: 'Cliente creado exitosamente'
};

// Error messages
ErrorMessages.Customers.notFound = {
    en: 'Customer not found',
    es: 'Cliente no encontrado'
};

// Usage
message: SuccessMessages.Customers.createCustomer[sLang]
```

---

## 12. Do's and Don'ts

### ✅ DO

1. **Always filter by `sEnterpriseId`** for multi-tenancy
2. **Always check `bActive = true`** for soft deletes
3. **Use transactions** for multi-table operations
4. **Validate foreign keys exist** before insert/update
5. **Use Hungarian notation** for database columns
6. **Set audit fields** (`sCreatedBy`, `sLastUpdatedBy`)
7. **Use `express-async-handler`** for async routes
8. **Return localized messages** using `sLang`
9. **Use `unaccent()`** for international character search
10. **Eager load relations** with `withGraphFetched()`
11. **Use pagination** for list endpoints
12. **Generate folios** before creating records
13. **Format dates** in `$afterFind` hook
14. **Use status adjacency maps** for workflow validation
15. **Cascade status changes** to parent entities when appropriate

### ❌ DON'T

1. **Never hard delete** - always soft delete with `bActive = false`
2. **Never skip permission checks** on routes
3. **Never return sensitive data** (passwords, tokens)
4. **Don't use `SELECT *`** - explicitly select fields
5. **Don't forget validation** with Celebrate middleware
6. **Don't expose internal errors** to clients
7. **Don't skip enterprise validation** - always verify ownership
8. **Don't forget indexes** on foreign keys in migrations
9. **Don't use synchronous file operations** - use async Storage service
10. **Don't skip transactions** when updating multiple tables
11. **Don't allow invalid status transitions** - check adjacency first
12. **Don't forget to update parent status** when child status changes
13. **Don't upload files outside transactions** - ensure atomicity
14. **Don't skip POD status validation** when uploading POD files
15. **Don't forget to cascade soft deletes** to related records

---

## Summary

This guide provides a complete blueprint for building SHIPO-style backend APIs:

1. **Simple CRUD** - Use Customers module pattern for basic entities
2. **Complex Workflows** - Use ShipmentLegs pattern for status tracking and file management
3. **Status Management** - Implement adjacency maps, status records, and cascade logic
4. **File Uploads** - Use join tables, S3 storage, and transaction-wrapped uploads
5. **Multi-tenancy** - Always filter by `sEnterpriseId`
6. **Soft Deletes** - Use `bActive` flag, never hard delete
7. **Permissions** - Check module + action code on every route
8. **Localization** - Support Spanish and English messages

**Key Technologies:** Node.js, Express, TypeScript, PostgreSQL, Knex, Objection, Celebrate/Joi, AWS S3

**For detailed status tracking patterns**, see the companion document: **STATUS_RECORDS_SKILL.md**
