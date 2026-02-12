# STATUS RECORDS PATTERN - Complete Implementation Guide

**Version:** 1.0
**Last Updated:** 2026-02-09
**Purpose:** Comprehensive guide for implementing status tracking systems with state machines, adjacency validation, and cascade logic

> **IMPORTANT:** This document is self-contained with all code examples inline. No external file references.

---

## Table of Contents

1. [Overview: Status vs StatusRecords](#1-overview-status-vs-statusrecords)
2. [Core Concepts](#2-core-concepts)
3. [Database Schema Pattern](#3-database-schema-pattern)
4. [Status Adjacency (State Machine)](#4-status-adjacency-state-machine)
5. [Status Records Model](#5-status-records-model)
6. [Creating Status Records](#6-creating-status-records)
7. [Cascade Logic to Parent Entities](#7-cascade-logic-to-parent-entities)
8. [Complete Examples](#8-complete-examples)
9. [Best Practices](#9-best-practices)
10. [Common Patterns](#10-common-patterns)

---

## 1. Overview: Status vs StatusRecords

### What's the Difference?

| Aspect | **Status Table** | **StatusRecords Table** |
|--------|------------------|------------------------|
| **Purpose** | Lookup/reference table | Historical timeline |
| **Content** | Available status definitions | Events/changes over time |
| **Lifecycle** | Static (rarely changes) | Dynamic (grows continuously) |
| **Example** | `ShipmentLegStatuses` | `ShipmentLegStatusRecords` |
| **Rows** | 10-20 status definitions | Unlimited (one per status change) |
| **Columns** | sStatusId, sNameSP, sNameEN, sColorHex, iOrder | sRecordId, sEntityId, sStatusId, tRecordDate, sComments |

### Analogy

Think of it like a dropdown menu vs. a history log:

- **Status Table** = The dropdown menu showing all possible choices (Pending, Approved, Rejected)
- **StatusRecords Table** = The audit log showing "Changed to Pending on 2026-01-15, then to Approved on 2026-01-20"

### Why Two Tables?

1. **Separation of Concerns**: Status definitions are stable, but the timeline is dynamic
2. **Historical Tracking**: You can see the complete journey of an entity through different statuses
3. **Audit Trail**: Who changed the status, when, and why (comments)
4. **Query Efficiency**: Get current status vs. full history as needed
5. **Reusability**: Same status definitions used across multiple entities

---

## 2. Core Concepts

### 2.1 Status Workflow (State Machine)

A status system is a **finite state machine** where:
- Entities can only be in ONE status at a time
- Transitions between statuses are controlled by an **adjacency map**
- Some statuses are **terminal** (no further transitions allowed)

**Example Workflow:**
```
PreShipment → Scheduled → Loading → On Transit → Delivered
                          ↓           ↓
                       Cancelled   Cancelled
```

### 2.2 Current Status

The "current status" is the MOST RECENT status record for an entity:

```sql
SELECT sStatusId
FROM StatusRecords
WHERE sEntityId = '...'
  AND bActive = true
ORDER BY created_at DESC
LIMIT 1
```

### 2.3 Status Records = Timeline

Every time an entity changes status, a NEW record is created:

| ID | EntityId | StatusId | Created At | Comments |
|----|----------|----------|------------|----------|
| 1 | leg-123 | PreShipment | 2026-01-10 10:00 | Initial creation |
| 2 | leg-123 | Scheduled | 2026-01-11 14:30 | Carrier assigned |
| 3 | leg-123 | Loading | 2026-01-12 08:00 | Pickup started |
| 4 | leg-123 | On Transit | 2026-01-12 10:45 | Left origin |
| 5 | leg-123 | Delivered | 2026-01-13 16:20 | Signed by recipient |

### 2.4 Cascade Logic

When a **child entity** changes status, the **parent entity** may need to update its status:

**Example:** When ALL legs of a shipment are delivered, the shipment itself becomes delivered.

```
Shipment (parent)
├─ ShipmentLeg 1 (child) → status changes to "Delivered"
├─ ShipmentLeg 2 (child) → status changes to "Delivered"
└─ ShipmentLeg 3 (child) → status changes to "Delivered"
                           ↓
           Shipment status updates to "Delivered"
```

---

## 3. Database Schema Pattern

### 3.1 Status Table (Lookup)

```typescript
// Migration: 2030_ShipmentLegStatuses.ts
export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('ShipmentLegStatuses', (table: any) => {
            table.uuid('sShipmentLegStatusId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();

            // Multilingual names
            table.string('sStatusNameSP').defaultTo('');  // Spanish: "En Tránsito"
            table.string('sStatusNameEN').defaultTo('');  // English: "On Transit"

            // UI display properties
            table.string('sColorHex').defaultTo('#000000');  // Color for UI (e.g., #3399ff)
            table.integer('iOrder').defaultTo(0);  // Display order in lists

            // Audit fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);
        });
}
```

**Status Table Columns:**
- `sStatusNameSP` / `sStatusNameEN` - Localized status names
- `sColorHex` - Color for UI badges (e.g., green for success, red for cancelled)
- `iOrder` - Sort order for displaying statuses in dropdowns
- Standard audit fields: `sCreatedBy`, `sLastUpdatedBy`, `bActive`, timestamps

### 3.2 StatusRecords Table (Timeline)

```typescript
// Migration: 2031_ShipmentLegStatusRecords.ts
export async function up(Knex): Promise<void> {
    return Knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        .createTable('ShipmentLegStatusRecords', (table: any) => {
            table.uuid('sShipmentLegStatusRecordId').unique().defaultTo(Knex.raw('uuid_generate_v4()')).primary();

            // Foreign keys
            table.uuid('sShipmentLegId').references('sShipmentLegId').inTable('ShipmentLegs');
            table.uuid('sShipmentLegStatusId').references('sShipmentLegStatusId').inTable('ShipmentLegStatuses');

            // Record metadata
            table.text('sComments').defaultTo('');  // User comments explaining the change
            table.timestamp('tRecordDate').defaultTo(null);  // When status change occurred (defaults to now if not provided)

            // Location tracking (optional - for GPS tracking)
            table.string('sLatitude').defaultTo('');
            table.string('sLongitude').defaultTo('');

            // Audit fields
            table.uuid('sCreatedBy').references('sUserId').inTable('Users').nullable();
            table.uuid('sLastUpdatedBy').references('sUserId').inTable('Users').nullable();
            table.boolean('bActive').defaultTo(true);
            table.timestamps(true, true);

            // Index for performance (get all records for an entity)
            table.index(['sShipmentLegId'], 'ShipmentLegStatusRecords_sShipmentLegId_idx');
        });
}
```

**StatusRecords Table Columns:**

**Standard Fields (always present):**
- `s{Entity}StatusRecordId` - Primary key (UUID)
- `s{Entity}Id` - Foreign key to parent entity (e.g., `sShipmentLegId`)
- `s{Entity}StatusId` - Foreign key to status lookup table
- `sComments` - Text field for user comments
- `tRecordDate` - When the status change occurred (defaults to `created_at` if null)
- `sCreatedBy` / `sLastUpdatedBy` - Audit trail
- `bActive` - Soft delete flag
- `created_at` / `updated_at` - Automatic timestamps

**Optional Fields (domain-specific):**
- `sLatitude` / `sLongitude` - GPS coordinates for location-based tracking
- Additional context fields specific to your domain

### 3.3 Naming Convention

| Component | Pattern | Example |
|-----------|---------|---------|
| Status Table | `{Entity}Statuses` | `ShipmentLegStatuses` |
| StatusRecords Table | `{Entity}StatusRecords` | `ShipmentLegStatusRecords` |
| Status PK | `s{Entity}StatusId` | `sShipmentLegStatusId` |
| StatusRecord PK | `s{Entity}StatusRecordId` | `sShipmentLegStatusRecordId` |
| Entity FK | `s{Entity}Id` | `sShipmentLegId` |
| Status FK | `s{Entity}StatusId` | `sShipmentLegStatusId` |

---

## 4. Status Adjacency (State Machine)

### 4.1 What is Status Adjacency?

An **adjacency map** defines which status transitions are allowed. It's the core of the state machine.

**Example Rules:**
- PreShipment can ONLY go to Cancelled
- Scheduled can go to Loading, Delayed, or Cancelled
- Delivered is a TERMINAL state (no further transitions)

### 4.2 Adjacency File Pattern

Create a file: `{entity}StatusAdjacency.ts`

```typescript
// shipmentLegStatusAdjacency.ts

// SIMPLIFIED VERSION - For validation in controller
export const ShipmentLegStatusTransitions: { [key: string]: string[] } = {
    // PreShipment → Cancelled ONLY
    'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba': [
        '115be908-edfe-420a-aa78-a18516c9d306'  // Cancelled
    ],

    // Scheduled → Loading, Delayed, Cancelled
    '53fb3937-a7ea-4cf3-9454-3b15cad55e60': [
        'ef903880-5c92-490f-b5fc-1ceafdd091f5',  // Loading
        'e29fd412-aad2-4433-aacf-6269d0371390',  // Delayed
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // Loading → On Transit, Cancelled
    'ef903880-5c92-490f-b5fc-1ceafdd091f5': [
        '85e4bdea-6ff1-43c7-9cd0-f5bb4b65fc74',  // On Transit
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // On Transit → At Destination, Cancelled
    '85e4bdea-6ff1-43c7-9cd0-f5bb4b65fc74': [
        '0a4c83c6-41b6-461a-9a03-e97a62d8efc2',  // At Destination
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // At Destination → Unloading, Cancelled
    '0a4c83c6-41b6-461a-9a03-e97a62d8efc2': [
        '53e46769-c32e-4f39-9148-e18ba9bce5f9',  // Unloading
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // Unloading → Delivered, Cancelled
    '53e46769-c32e-4f39-9148-e18ba9bce5f9': [
        '8253af08-6800-461d-9662-48237f5d42f6',  // Delivered
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // Delayed → Loading, Cancelled
    'e29fd412-aad2-4433-aacf-6269d0371390': [
        'ef903880-5c92-490f-b5fc-1ceafdd091f5',  // Loading
        '115be908-edfe-420a-aa78-a18516c9d306'   // Cancelled
    ],

    // Delivered - TERMINAL STATE (no further transitions)
    '8253af08-6800-461d-9662-48237f5d42f6': [],

    // Cancelled - TERMINAL STATE (no further transitions)
    '115be908-edfe-420a-aa78-a18516c9d306': []
};

// VISUAL VERSION - For UI display (shows status details)
export const ShipmentLegStatusTransitionsVisual: {
    [key: string]: Array<{
        sShipmentLegStatusId: string;
        sStatusNameSP: string;
        sStatusNameEN: string;
        iOrder: number;
        sColorHex: string;
    }>
} = {
    // PreShipment → Cancelled ONLY
    'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba': [
        {
            sShipmentLegStatusId: '115be908-edfe-420a-aa78-a18516c9d306',
            sStatusNameSP: 'Cancelada',
            sStatusNameEN: 'Cancelled',
            iOrder: 99,
            sColorHex: '#ff0000'
        }
    ],

    // Scheduled → Loading, Delayed, Cancelled
    '53fb3937-a7ea-4cf3-9454-3b15cad55e60': [
        {
            sShipmentLegStatusId: 'ef903880-5c92-490f-b5fc-1ceafdd091f5',
            sStatusNameSP: 'Cargando',
            sStatusNameEN: 'Loading',
            iOrder: 2,
            sColorHex: '#ffcc00'
        },
        {
            sShipmentLegStatusId: 'e29fd412-aad2-4433-aacf-6269d0371390',
            sStatusNameSP: 'Retrasada',
            sStatusNameEN: 'Delayed',
            iOrder: 8,
            sColorHex: '#ff6600'
        },
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

**Two Versions - Why?**

1. **Simplified** (`ShipmentLegStatusTransitions`):
   - Used in **controller validation** - "Is this transition allowed?"
   - Just arrays of status IDs - lightweight and fast
   - Example: `['id1', 'id2', 'id3']`

2. **Visual** (`ShipmentLegStatusTransitionsVisual`):
   - Used in **UI/frontend** - "Show user available next statuses with names and colors"
   - Includes full status details for display
   - Example: `[{id: 'id1', name: 'Loading', color: '#ffcc00'}, ...]`

### 4.3 Terminal States

Terminal states have **empty arrays** - no further transitions:

```typescript
// Delivered - no further transitions
'8253af08-6800-461d-9662-48237f5d42f6': [],

// Cancelled - no further transitions
'115be908-edfe-420a-aa78-a18516c9d306': []
```

---

## 5. Status Records Model

### 5.1 Model Pattern

```typescript
import { Model, RelationMappings } from 'objection';
import { db } from '../../../../Config/Db.config';
import { UsersModel } from '../../../004_Users/users.model';
import { ShipmentLegsModel } from '../../shipmentLegs.model';
import { ShipmentLegStatusesModel } from '../shipmentLegStatuses.model';
import * as MomentServices from '../../../../Services/Moment.services';

Model.knex(db);

export interface IShipmentLegStatusRecord {
    sShipmentLegStatusRecordId?: string;
    sShipmentLegId?: string;
    sShipmentLegStatusId?: string;
    sComments?: string;
    sLatitude?: string;
    sLongitude?: string;
    tRecordDate?: Date;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class ShipmentLegStatusRecordsModel extends Model implements IShipmentLegStatusRecord {
    public sShipmentLegStatusRecordId?: string;
    public sShipmentLegId?: string;
    public sShipmentLegStatusId?: string;
    public sComments?: string;
    public sLatitude?: string;
    public sLongitude?: string;
    public tRecordDate?: Date;
    public ShipmentLegStatus: any;  // Relation object

    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public bActive?: boolean;

    // Formatted dates for frontend
    public formattedCreatedAt?: string;
    public formattedUpdatedAt?: string;
    public tFormattedRecordDate?: string;

    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'ShipmentLegStatusRecords';
    static idColumn: string = 'sShipmentLegStatusRecordId';

    static relationMappings: RelationMappings = {
        ShipmentLeg: {
            relation: Model.BelongsToOneRelation,
            modelClass: ShipmentLegsModel,
            join: {
                from: 'ShipmentLegStatusRecords.sShipmentLegId',
                to: 'ShipmentLegs.sShipmentLegId'
            }
        },

        ShipmentLegStatus: {
            relation: Model.BelongsToOneRelation,
            modelClass: ShipmentLegStatusesModel,
            join: {
                from: 'ShipmentLegStatusRecords.sShipmentLegStatusId',
                to: 'ShipmentLegStatuses.sShipmentLegStatusId'
            }
        },

        CreatedByUser: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'ShipmentLegStatusRecords.sCreatedBy',
                to: 'Users.sUserId'
            }
        },

        LastUpdatedByUser: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'ShipmentLegStatusRecords.sLastUpdatedBy',
                to: 'Users.sUserId'
            }
        }
    };

    async $beforeInsert() {
        this.created_at = new Date();
        // If tRecordDate not provided, default to creation time
        if (!this.tRecordDate) {
            this.tRecordDate = this.created_at;
        }
    }

    async $beforeUpdate() {
        this.updated_at = new Date();
    }

    async $afterFind() {
        // Format all dates for timezone-adjusted display
        if (this.created_at) {
            this.formattedCreatedAt = MomentServices.FormatDateWithHoursUTCSix(this.created_at);
        }
        if (this.updated_at) {
            this.formattedUpdatedAt = MomentServices.FormatDateWithHoursUTCSix(this.updated_at);
        }
        if (this.tRecordDate) {
            this.tFormattedRecordDate = MomentServices.FormatDateWithHoursUTCSix(this.tRecordDate);
        }
    }
}
```

**Key Model Patterns:**
- Relations to entity, status lookup, and audit users
- `$beforeInsert` sets `tRecordDate` to current time if not provided
- `$afterFind` formats dates for timezone-adjusted display
- Standard audit fields and soft delete support

---

## 6. Creating Status Records

### 6.1 Controller Pattern

```typescript
import { Response, Request, NextFunction } from 'express';
import MyError from '../../../../Middlewares/Error.mw';
import ShipmentLegStatusRecordsQueries from './shipmentLegStatusRecords.queries';
import ShipmentLegQueries from '../../shipmentLegs.queries';
import { ShipmentLegStatusTransitions } from '../shipmentLegStatusAdjacency';
import SuccessMessages from '../../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../../Utils/ErrorMessages.util';

class Controllers {
    async createShipmentLegStatusRecord(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId, sEnterpriseId} = res.locals;
        const {sShipmentLegId} = req.params;
        const {sShipmentLegStatusId, sComments, sLatitude, sLongitude, tRecordDate} = req.body;

        // STEP 1: Verify entity exists and belongs to enterprise
        const myShipmentLeg = await ShipmentLegQueries.verifyShipmentLegExistsByEnterprise(sEnterpriseId, sShipmentLegId);
        if (!myShipmentLeg) {
            return next(new MyError(404, ErrorMessages.ShipmentLegs.notFound[sLang]));
        }

        // STEP 2: Verify the status exists
        const myShipmentLegStatus = await ShipmentLegStatusRecordsQueries.verifyShipmentLegStatusExists(sShipmentLegStatusId);
        if (!myShipmentLegStatus) {
            return next(new MyError(404, ErrorMessages.ShipmentLegStatuses.notFound[sLang]));
        }

        // STEP 3: Get current status
        const myCurrentStatus = await ShipmentLegStatusRecordsQueries.findCurrentStatusByShipmentLeg(sShipmentLegId);

        // STEP 4: If NO current status, first status must be initial state
        if (!myCurrentStatus) {
            // HARDCODED INITIAL STATUS ID (PreShipment)
            if (sShipmentLegStatusId !== 'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba') {
                return next(new MyError(400, ErrorMessages.ShipmentLegStatuses.mustBePreShipment[sLang]));
            }
        }

        // STEP 5: Get available next statuses from adjacency map
        var arrAvailableNextStatuses = ShipmentLegStatusTransitions[myCurrentStatus?.ShipmentLegStatus?.sShipmentLegStatusId] || [];

        // STEP 6: Validate transition is allowed
        if (myCurrentStatus && !arrAvailableNextStatuses.includes(sShipmentLegStatusId)) {
            return next(new MyError(404, ErrorMessages.ShipmentLegStatuses.invalidStatus[sLang]));
        }

        // STEP 7: Insert status record (this triggers cascade logic)
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
}

export default new Controllers();
```

**Controller Validation Flow:**

1. ✅ **Verify entity exists** - Entity must belong to the requesting enterprise
2. ✅ **Verify status exists** - The target status must be valid
3. ✅ **Get current status** - Fetch most recent status record
4. ✅ **Initial status validation** - If no current status, must start with initial state
5. ✅ **Get allowed transitions** - Look up adjacency map for current status
6. ✅ **Validate transition** - Check if requested status is in allowed list
7. ✅ **Insert record** - Create the new status record (with cascade logic)

### 6.2 Getting Current Status Query

```typescript
// Get current status for an entity
static async findCurrentStatusByShipmentLeg(sShipmentLegId) {
    return await ShipmentLegStatusRecordsModel.query().modify(function (queryBuilder: any) {
        queryBuilder.where('bActive', true)
        queryBuilder.where('sShipmentLegId', sShipmentLegId)

        // Eager load the status details
        queryBuilder.withGraphFetched('[ShipmentLegStatus, CreatedByUser, LastUpdatedByUser]')
        queryBuilder.modifyGraph('ShipmentLegStatus', builder => {
            builder.select('*');
        })
        queryBuilder.modifyGraph('CreatedByUser', builder => {
            builder.select('sName', 'sLastName', 'sEmail');
        })
        queryBuilder.modifyGraph('LastUpdatedByUser', builder => {
            builder.select('sName', 'sLastName', 'sEmail');
        })
    })
    .orderBy('created_at', 'desc')  // Most recent first
    .first();  // Get only the latest
}
```

**Pattern:**
- Filter by `bActive = true` (soft delete)
- Order by `created_at DESC` to get most recent
- Use `.first()` to get only the latest record
- Eager load status details and user info

### 6.3 Getting ALL Status Records Query

```typescript
// Get ALL status records for an entity (full timeline)
static async findAllShipmentLegStatusRecordsByShipmentLeg(sShipmentLegId) {
    return await ShipmentLegStatusRecordsModel.query().modify(function (queryBuilder: any) {
        queryBuilder.where('bActive', true)
        queryBuilder.where('sShipmentLegId', sShipmentLegId)

        // Eager load relations
        queryBuilder.withGraphFetched('[ShipmentLegStatus, CreatedByUser, LastUpdatedByUser]')
        queryBuilder.modifyGraph('ShipmentLegStatus', builder => {
            builder.select('*');
        })
        queryBuilder.modifyGraph('CreatedByUser', builder => {
            builder.select('sName', 'sLastName', 'sEmail');
        })
        queryBuilder.modifyGraph('LastUpdatedByUser', builder => {
            builder.select('sName', 'sLastName', 'sEmail');
        })
    })
    .orderBy('created_at', 'desc');  // Most recent first
}
```

**Usage:**
- Returns complete timeline for entity
- Ordered newest → oldest for chronological display
- Includes full status details and user info

---

## 7. Cascade Logic to Parent Entities

### 7.1 When to Use Cascade Logic

**Use cascade when:**
- Child status change affects parent status
- Example: All legs delivered → Shipment delivered
- Example: Any leg cancelled → Shipment cancelled

**Don't use cascade when:**
- Child and parent are independent
- Parent status is manually controlled

### 7.2 Insert Status Record with Cascade

```typescript
static async insertShipmentLegStatusRecord({
    sShipmentLegId,
    sShipmentLegStatusId,
    sComments,
    sLatitude,
    sLongitude,
    tRecordDate,
    sCreatedBy,
    sLastUpdatedBy
}) {
    return await ShipmentLegStatusRecordsModel.transaction(async (trx) => {
        const DELIVERED_STATUS_ID = '8253af08-6800-461d-9662-48237f5d42f6';
        const LOADING_STATUS_ID = 'ef903880-5c92-490f-b5fc-1ceafdd091f5';

        // ==================== PHASE 1: Get previous state ====================

        const currentLegStatus = await ShipmentLegStatusRecordsModel.query(trx)
            .select('sShipmentLegStatusId')
            .where('sShipmentLegId', sShipmentLegId)
            .where('bActive', true)
            .orderBy('created_at', 'desc')
            .first();

        const legWasDelivered = currentLegStatus?.sShipmentLegStatusId === DELIVERED_STATUS_ID;
        const legIsBeingDelivered = sShipmentLegStatusId === DELIVERED_STATUS_ID;

        // ==================== PHASE 2: Insert new status record ====================

        const statusRecord = await ShipmentLegStatusRecordsModel.query(trx).insert({
            sShipmentLegId,
            sShipmentLegStatusId,
            sComments,
            sLatitude,
            sLongitude,
            tRecordDate,
            sCreatedBy,
            sLastUpdatedBy
        });

        // ==================== PHASE 3: Update entity timestamps ====================

        // Set tRealDeliveryDate when status becomes Delivered
        if (legIsBeingDelivered && !legWasDelivered) {
            await ShipmentLegsModel.query(trx).patchAndFetchById(sShipmentLegId, {
                tRealDeliveryDate: new Date(),
                sLastUpdatedBy: sLastUpdatedBy
            });
        }
        // Clear tRealDeliveryDate if status changed away from Delivered
        else if (legWasDelivered && !legIsBeingDelivered) {
            await ShipmentLegsModel.query(trx).patchAndFetchById(sShipmentLegId, {
                tRealDeliveryDate: null,
                sLastUpdatedBy: sLastUpdatedBy
            });
        }

        // ==================== PHASE 4: CASCADE TO PARENT SHIPMENT ====================

        // Get shipment ID
        const shipmentLeg = await ShipmentLegsModel.query(trx)
            .select('sShipmentId')
            .findById(sShipmentLegId)
            .where('bActive', true);

        if (shipmentLeg?.sShipmentId) {
            const sShipmentId = shipmentLeg.sShipmentId;

            // Get ALL legs for this shipment with their current statuses
            const allLegsWithStatus = await ShipmentLegsModel.query(trx)
                .select('ShipmentLegs.sShipmentLegId')
                .select('CurrentStatus.sShipmentLegStatusId as currentStatusId')
                .where('ShipmentLegs.sShipmentId', sShipmentId)
                .where('ShipmentLegs.bActive', true)
                .with('CurrentStatus',
                    ShipmentLegStatusRecordsModel.query()
                    // CTE to get latest status for each leg
                    .joinRaw(`JOIN (
                        SELECT "sShipmentLegId", MAX("created_at") AS "latest_date"
                        FROM "ShipmentLegStatusRecords"
                        WHERE "bActive" = true
                        GROUP BY "sShipmentLegId"
                    ) AS "latest" ON "ShipmentLegStatusRecords"."sShipmentLegId" = "latest"."sShipmentLegId"
                    AND "ShipmentLegStatusRecords"."created_at" = "latest"."latest_date"`)
                    .select('ShipmentLegStatusRecords.sShipmentLegId', 'ShipmentLegStatusRecords.sShipmentLegStatusId')
                    .where('ShipmentLegStatusRecords.bActive', true)
                )
                .leftJoin('CurrentStatus', 'CurrentStatus.sShipmentLegId', 'ShipmentLegs.sShipmentLegId');

            const totalLegs = allLegsWithStatus.length;

            // ==================== Count status types ====================

            let deliveredCount = 0;
            let scheduledCount = 0;
            let loadingOrBeyondCount = 0;
            let preshipmentCount = 0;
            let cancelledCount = 0;
            let delayedCount = 0;

            allLegsWithStatus.forEach(leg => {
                const statusId = leg.currentStatusId || 'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba';  // Default to PreShipment

                if (statusId === '115be908-edfe-420a-aa78-a18516c9d306') {
                    cancelledCount++;
                } else if (statusId === DELIVERED_STATUS_ID) {
                    deliveredCount++;
                } else if (statusId === '53fb3937-a7ea-4cf3-9454-3b15cad55e60') {
                    scheduledCount++;
                } else if (statusId === 'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba') {
                    preshipmentCount++;
                } else if (statusId === 'e29fd412-aad2-4433-aacf-6269d0371390') {
                    delayedCount++;
                } else {
                    loadingOrBeyondCount++;
                }
            });

            // ==================== Determine parent status (priority order) ====================

            let newShipmentStatusId;

            // PRIORITY 1: If ANY leg is cancelled, shipment becomes cancelled
            if (cancelledCount > 0) {
                newShipmentStatusId = '80b9239e-65e3-45c9-bae4-b08711e10b47';  // Cancelled
            }
            // PRIORITY 2: If all NON-CANCELLED legs are delivered
            else if (deliveredCount === (totalLegs - cancelledCount) && deliveredCount > 0) {
                newShipmentStatusId = 'c2b6fa5e-0925-41ce-915d-3a247957228f';  // Delivered
            }
            // PRIORITY 3: If ANY leg is delayed
            else if (delayedCount > 0) {
                newShipmentStatusId = 'f5677abf-c7de-4b53-b752-2cf3b92618f6';  // Delayed
            }
            // PRIORITY 4: If any leg is loading or beyond
            else if (loadingOrBeyondCount > 0 || deliveredCount > 0) {
                newShipmentStatusId = '850aa255-a04b-4dd3-87a6-11782d3d95b5';  // In Progress
            }
            // PRIORITY 5: If all are scheduled
            else if (scheduledCount === (totalLegs - cancelledCount) && preshipmentCount === 0) {
                newShipmentStatusId = '2aead2ed-0bda-44af-9771-fea0202b2ee6';  // Scheduled
            }
            // PRIORITY 6: Some are scheduled
            else if (scheduledCount > 0) {
                newShipmentStatusId = 'fb2e9327-7b0a-4f7f-95e7-3496e8b9dfd5';  // Partially Scheduled
            }
            // PRIORITY 7: Default to created
            else {
                newShipmentStatusId = '9c1b65f6-7866-4924-a935-c746387afe63';  // Created
            }

            // ==================== Get current shipment status ====================

            const currentShipmentStatus = await ShipmentStatusRecordsModel.query(trx)
                .select('sShipmentStatusId')
                .where('sShipmentId', sShipmentId)
                .where('bActive', true)
                .orderBy('created_at', 'desc')
                .first();

            // ==================== Only insert if status changed ====================

            if (currentShipmentStatus?.sShipmentStatusId !== newShipmentStatusId) {
                await ShipmentStatusRecordsModel.query(trx).insert({
                    sShipmentId,
                    sShipmentStatusId: newShipmentStatusId,
                    sComments: cancelledCount > 0
                        ? 'Cancelled shipment - one or more legs were cancelled.'
                        : 'Automatic update based on shipment legs',
                    sCreatedBy: sLastUpdatedBy,
                    sLastUpdatedBy: sLastUpdatedBy
                });
            }

            // ==================== Update parent timestamps ====================

            let shipmentUpdates = { sLastUpdatedBy: sLastUpdatedBy };

            // Get current shipment data
            const currentShipment = await ShipmentsModel.query(trx)
                .select('tPickupDate')
                .findById(sShipmentId)
                .where('bActive', true);

            // Set pickup date when FIRST leg goes to Loading
            if (sShipmentLegStatusId === LOADING_STATUS_ID && !currentShipment?.tPickupDate) {
                shipmentUpdates.tPickupDate = new Date();
            }

            // Set delivery date when ALL legs are delivered
            if (deliveredCount === (totalLegs - cancelledCount) && deliveredCount > 0) {
                shipmentUpdates.tRealDeliveryDate = new Date();
            }

            // Apply updates if any
            if (Object.keys(shipmentUpdates).length > 1) {
                await ShipmentsModel.query(trx).patchAndFetchById(sShipmentId, shipmentUpdates);
            }
        }

        return statusRecord;
    });
}
```

**Cascade Logic Phases:**

1. **Get Previous State** - Check what status the entity had before
2. **Insert New Record** - Create the new status record
3. **Update Entity Timestamps** - Set delivery dates, pickup dates, etc.
4. **Get All Siblings** - Fetch all child entities and their current statuses
5. **Count Status Types** - Aggregate by status (how many delivered, how many cancelled, etc.)
6. **Determine Parent Status** - Apply priority rules to calculate parent status
7. **Check Current Parent Status** - Avoid duplicate status records
8. **Insert Parent Status Record** - Only if status actually changed
9. **Update Parent Timestamps** - Set dates based on aggregate child state

**Priority Rules Example:**
```
PRIORITY 1: Any cancelled → Parent cancelled
PRIORITY 2: All delivered → Parent delivered
PRIORITY 3: Any delayed → Parent delayed
PRIORITY 4: Any in-progress → Parent in-progress
PRIORITY 5: All scheduled → Parent scheduled
PRIORITY 6: Some scheduled → Parent partially scheduled
PRIORITY 7: Default → Parent created
```

---

## 8. Complete Examples

### 8.1 ShipmentLegStatusRecords Example

See Section 7.2 for the complete implementation.

### 8.2 ShipmentOrderStatusRecords Pattern

```typescript
// Similar pattern but without cascade (ShipmentOrders don't have parent entities)

static async insertShipmentOrderStatusRecord({
    sShipmentOrderId,
    sShipmentOrderStatusId,
    sComments,
    sLatitude,
    sLongitude,
    tRecordDate,
    sCreatedBy,
    sLastUpdatedBy
}) {
    return await ShipmentOrderStatusRecordsModel.transaction(async (trx) => {
        const DELIVERED_STATUS_ID = '1c2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a';

        // Get previous state
        const currentStatus = await ShipmentOrderStatusRecordsModel.query(trx)
            .select('sShipmentOrderStatusId')
            .where('sShipmentOrderId', sShipmentOrderId)
            .where('bActive', true)
            .orderBy('created_at', 'desc')
            .first();

        const wasDelivered = currentStatus?.sShipmentOrderStatusId === DELIVERED_STATUS_ID;
        const isBeingDelivered = sShipmentOrderStatusId === DELIVERED_STATUS_ID;

        // Insert status record
        const statusRecord = await ShipmentOrderStatusRecordsModel.query(trx).insert({
            sShipmentOrderId,
            sShipmentOrderStatusId,
            sComments,
            sLatitude,
            sLongitude,
            tRecordDate,
            sCreatedBy,
            sLastUpdatedBy
        });

        // Update delivery timestamp
        if (isBeingDelivered && !wasDelivered) {
            await ShipmentOrdersModel.query(trx).patchAndFetchById(sShipmentOrderId, {
                tRealDeliveryDate: new Date(),
                sLastUpdatedBy: sLastUpdatedBy
            });
        }
        else if (wasDelivered && !isBeingDelivered) {
            await ShipmentOrdersModel.query(trx).patchAndFetchById(sShipmentOrderId, {
                tRealDeliveryDate: null,
                sLastUpdatedBy: sLastUpdatedBy
            });
        }

        // NO CASCADE - ShipmentOrders don't have parent entities

        return statusRecord;
    });
}
```

**Difference:** No cascade logic since ShipmentOrders are top-level entities.

---

## 9. Best Practices

### 9.1 Always Use Transactions

```typescript
return await StatusRecordsModel.transaction(async (trx) => {
    // All operations in one transaction
});
```

**Why:**
- Atomicity - All changes succeed or all fail
- Consistency - Parent/child updates happen together
- Isolation - Other queries see consistent state

### 9.2 Check Previous State Before Updates

```typescript
const currentStatus = await Model.query(trx)
    .select('sStatusId')
    .where('sEntityId', entityId)
    .orderBy('created_at', 'desc')
    .first();

const wasDelivered = currentStatus?.sStatusId === DELIVERED_ID;
const isBeingDelivered = sStatusId === DELIVERED_ID;

// Only update timestamps when transitioning TO or FROM delivered
if (isBeingDelivered && !wasDelivered) {
    // Set delivery date
}
else if (wasDelivered && !isBeingDelivered) {
    // Clear delivery date
}
```

**Why:** Prevents unnecessary updates and maintains data integrity.

### 9.3 Only Insert Parent Status if Changed

```typescript
const currentParentStatus = await ParentStatusRecordsModel.query(trx)
    .select('sStatusId')
    .where('sParentId', parentId)
    .orderBy('created_at', 'desc')
    .first();

if (currentParentStatus?.sStatusId !== newStatusId) {
    await ParentStatusRecordsModel.query(trx).insert({...});
}
```

**Why:** Avoids duplicate status records cluttering the timeline.

### 9.4 Use Descriptive Comments for Cascade Updates

```typescript
sComments: cancelledCount > 0
    ? 'Cancelled shipment - one or more legs were cancelled.'
    : 'Automatic update based on shipment legs'
```

**Why:** Helps users understand why the status changed automatically.

### 9.5 Validate Initial Status

```typescript
if (!myCurrentStatus) {
    if (sStatusId !== INITIAL_STATUS_ID) {
        return next(new MyError(400, "First status must be PreShipment"));
    }
}
```

**Why:** Enforces that entities start in the correct initial state.

### 9.6 Use Constants for Status IDs

```typescript
const DELIVERED_STATUS_ID = '8253af08-6800-461d-9662-48237f5d42f6';
const CANCELLED_STATUS_ID = '115be908-edfe-420a-aa78-a18516c9d306';
const LOADING_STATUS_ID = 'ef903880-5c92-490f-b5fc-1ceafdd091f5';
```

**Why:** Makes code more readable and maintainable.

---

## 10. Common Patterns

### 10.1 Get Current Status with CTE (Common Table Expression)

```typescript
// Using PostgreSQL CTE to get latest status efficiently
const legsWithCurrentStatus = await ShipmentLegsModel.query(trx)
    .select('ShipmentLegs.sShipmentLegId')
    .select('CurrentStatus.sShipmentLegStatusId as currentStatusId')
    .where('ShipmentLegs.sShipmentId', sShipmentId)
    .where('ShipmentLegs.bActive', true)
    .with('CurrentStatus',
        ShipmentLegStatusRecordsModel.query()
        .joinRaw(`JOIN (
            SELECT "sShipmentLegId", MAX("created_at") AS "latest_date"
            FROM "ShipmentLegStatusRecords"
            WHERE "bActive" = true
            GROUP BY "sShipmentLegId"
        ) AS "latest" ON "ShipmentLegStatusRecords"."sShipmentLegId" = "latest"."sShipmentLegId"
        AND "ShipmentLegStatusRecords"."created_at" = "latest"."latest_date"`)
        .select('ShipmentLegStatusRecords.sShipmentLegId', 'ShipmentLegStatusRecords.sShipmentLegStatusId')
        .where('ShipmentLegStatusRecords.bActive', true)
    )
    .leftJoin('CurrentStatus', 'CurrentStatus.sShipmentLegId', 'ShipmentLegs.sShipmentLegId');
```

**Why:** More efficient than multiple queries in a loop.

### 10.2 Priority-Based Status Calculation

```typescript
// Define clear priority order
if (cancelledCount > 0) {
    newStatus = CANCELLED;
}
else if (allDelivered) {
    newStatus = DELIVERED;
}
else if (anyDelayed) {
    newStatus = DELAYED;
}
else if (anyInProgress) {
    newStatus = IN_PROGRESS;
}
else {
    newStatus = DEFAULT;
}
```

**Why:** Makes business logic explicit and easy to modify.

### 10.3 Optional tRecordDate

```typescript
// In $beforeInsert hook
async $beforeInsert() {
    this.created_at = new Date();
    if (!this.tRecordDate) {
        this.tRecordDate = this.created_at;
    }
}
```

**Why:** Allows backdating status changes while defaulting to current time.

### 10.4 Location Tracking

```typescript
// Optional GPS coordinates
table.string('sLatitude').defaultTo('');
table.string('sLongitude').defaultTo('');

// In controller
const {sLatitude, sLongitude} = req.body;
await StatusRecordsQueries.insertStatusRecord({
    sLatitude: sLatitude || '',
    sLongitude: sLongitude || ''
});
```

**Why:** Useful for logistics tracking (where was the status changed from).

---

## Summary

### Key Takeaways

1. **Two Tables:**
   - Status table = Lookup/reference (static)
   - StatusRecords table = Timeline/history (dynamic)

2. **State Machine:**
   - Adjacency map defines allowed transitions
   - Validate transitions in controller
   - Terminal states have empty arrays

3. **Current Status:**
   - Most recent record (ORDER BY created_at DESC LIMIT 1)
   - Always filter by bActive = true

4. **Cascade Logic:**
   - Child status changes trigger parent status updates
   - Get ALL siblings, count by status type
   - Apply priority rules to determine parent status
   - Only insert if parent status actually changed

5. **Best Practices:**
   - Always use transactions
   - Check previous state before updates
   - Validate initial status
   - Use descriptive comments for automatic updates
   - Only insert parent status if changed

### Implementation Checklist

✅ Create Status table (lookup)
✅ Create StatusRecords table (timeline)
✅ Create Status model with relations
✅ Create StatusRecords model with relations
✅ Create adjacency map file
✅ Implement controller validation
✅ Implement insert query with cascade
✅ Add current status query
✅ Add status timeline query
✅ Test all status transitions
✅ Test cascade logic
✅ Validate terminal states

---

**End of STATUS_RECORDS_SKILL.md**

For main backend patterns, see **SKILL.md**
