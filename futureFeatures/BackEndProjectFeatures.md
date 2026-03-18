# MY VILLAGE — Ultimate Backend Integration Guide

**Version:** 1.1
**Date:** 2026-03-16
**Purpose:** This document is the definitive, hyper-specific guide for the backend team (Claude) to understand exactly what the frontend needs, what exists, what's broken, and what's missing. Every endpoint, every field, every business rule.

**Base URL:** `{{baseUrl}}/api/v1/sp`

---

## TABLE OF CONTENTS

1. [Current State Summary](#1-current-state-summary)
2. [Bugs & Fixes in Existing Endpoints](#2-bugs--fixes-in-existing-endpoints)
3. [Missing: School Users (SchoolUser) CRUD](#3-missing-school-users-schooluser-crud)
4. [Missing: Tracking Records CRUD](#4-missing-tracking-records-crud)
5. [Missing: Record Documents (RecordFiles)](#5-missing-record-documents-recordfiles)
6. [Missing: IEP Persistence](#6-missing-iep-persistence)
7. [Missing: Profile Management](#7-missing-profile-management)
8. [Missing: Reports / Student Analytics](#8-missing-reports--student-analytics)
9. [Enhancements to Existing Endpoints](#9-enhancements-to-existing-endpoints)
10. [Field Name Mapping Reference](#10-field-name-mapping-reference)
11. [Database Tables Reference](#11-database-tables-reference)
12. [Business Rules Reference](#12-business-rules-reference)
13. [Frontend Integration Notes](#13-frontend-integration-notes)
14. [Complete Checklist](#14-complete-checklist--what-backend-must-deliver)

---

## 1. Current State Summary

### Endpoints That EXIST and WORK (from Postman collection)

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | POST | `/auth/login` | None | Working |
| 2 | POST | `/auth/recovery` | None | Working |
| 3 | POST | `/auth/setPassword` | None | Working |
| 4 | GET | `/auth/verify/{token}` | None | Working |
| 5 | GET | `/schools/analytics` | SuperAdmin | Partially working (see bugs) |
| 6 | POST | `/schools` | SuperAdmin | Working |
| 7 | GET | `/schools` | SuperAdmin | Partially working (see bugs) |
| 8 | GET | `/schools/{id}` | SuperAdmin | Partially working (see bugs) |
| 9 | PUT | `/schools/{id}` | SuperAdmin | Working |
| 10 | PATCH | `/schools/{id}` | SuperAdmin | Working |
| 11 | POST | `/schools/{id}/image` | SuperAdmin | Working (CORS/S3 issues) |
| 12 | DELETE | `/schools/{id}` | SuperAdmin | Working |
| 13 | POST | `/students` | SchoolAdmin | Working |
| 14 | GET | `/students` | SchoolAdmin | Partially working (see bugs) |
| 15 | GET | `/students/{id}` | SchoolAdmin | Working |
| 16 | PUT | `/students/{id}` | SchoolAdmin | Working |
| 17 | DELETE | `/students/{id}` | SchoolAdmin | Working |
| 18 | POST | `/goals` | SchoolAdmin | Working |
| 19 | GET | `/goals/student/{id}` | SchoolAdmin | Working |
| 20 | GET | `/goals/{id}` | SchoolAdmin | Working |
| 21 | PUT | `/goals/{id}` | SchoolAdmin | Working |
| 22 | PATCH | `/goals/{id}/complete` | SchoolAdmin | Working |
| 23 | DELETE | `/goals/{id}` | SchoolAdmin | Working |
| 24 | GET | `/goals/{id}/goalTasks` | SchoolAdmin | Working |
| 25 | PUT | `/goals/{id}/goalTasks/{taskId}` | SchoolAdmin | Working |
| 26 | PATCH | `/goals/{id}/goalTasks/{taskId}/toggle` | SchoolAdmin | Working |
| 27 | DELETE | `/goals/{id}/goalTasks/{taskId}` | SchoolAdmin | Working |
| 28 | POST | `/goals/{id}/goalFiles` | SchoolAdmin | Working (CORS/S3 issues) |
| 29 | GET | `/goals/{id}/goalFiles` | SchoolAdmin | Working |
| 30 | DELETE | `/goals/{id}/goalFiles/{fileId}` | SchoolAdmin | Working |

### Endpoints That DO NOT EXIST Yet

| # | Method | Endpoint | Module | Priority |
|---|--------|----------|--------|----------|
| 1 | GET | `/schoolUsers` | School Users | CRITICAL |
| 2 | POST | `/schoolUsers` | School Users | CRITICAL |
| 3 | GET | `/schoolUsers/{id}` | School Users | CRITICAL |
| 4 | PUT | `/schoolUsers/{id}` | School Users | CRITICAL |
| 5 | PATCH | `/schoolUsers/{id}` | School Users | HIGH |
| 6 | POST | `/schoolUsers/{id}/resetPassword` | School Users | HIGH |
| 7 | POST | `/trackingRecords` | Tracking Records | CRITICAL |
| 8 | GET | `/goals/{id}/trackingRecords` | Tracking Records | CRITICAL |
| 9 | GET | `/trackingRecords/{id}` | Tracking Records | MEDIUM |
| 10 | PUT | `/trackingRecords/{id}` | Tracking Records | MEDIUM |
| 11 | DELETE | `/trackingRecords/{id}` | Tracking Records | MEDIUM |
| 12 | PATCH | `/trackingRecords/{id}/toggleExclusion` | Tracking Records | HIGH |
| 13 | POST | `/trackingRecords/{id}/files` | Record Files | MEDIUM |
| 14 | GET | `/trackingRecords/{id}/files` | Record Files | MEDIUM |
| 15 | DELETE | `/trackingRecords/{id}/files/{fileId}` | Record Files | MEDIUM |
| 16 | POST | `/students/{id}/iep` | IEP | HIGH |
| 17 | GET | `/students/{id}/iep` | IEP | HIGH |
| 18 | PUT | `/students/{id}/iep` | IEP | HIGH |
| 19 | PUT | `/profile` | Profile | HIGH |
| 20 | PUT | `/profile/password` | Profile | HIGH |
| 21 | GET | `/students/{id}/report` | Reports | MEDIUM |

---

## 2. Bugs & Fixes in Existing Endpoints

### BUG 1: Dashboard Analytics — Trend Chart Data Missing
**Endpoint:** `GET /schools/analytics`
**Problem:** The response only returns `{ countActiveSchools }`. The frontend needs a LOT more data.
**Frontend sends:** `?tStartDate=2026-03-01&tEndDate=2026-03-16`
**Problem:** The date filters don't change the response at all.

**REQUIRED response structure:**
```json
{
  "message": "Success",
  "success": true,
  "iTotalSchools": 15,
  "iActiveSchools": 12,
  "iInactiveSchools": 3,
  "iTotalStudents": 245,
  "sStudentsTrend": "+5.2%",
  "iGoalProgress": 67,
  "sGoalsTrend": "+3.1%",
  "dAvgStudents": 20.4,
  "dAvgTeachers": 4.2,
  "dAvgAdminStaff": 2.1,
  "aChartLabels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  "aGoalsTotalByMonth": [12, 18, 25, 30, 22, 15],
  "aGoalsCompletedByMonth": [5, 8, 12, 15, 10, 7],
  "aRecentSchools": [
    {
      "sSchoolId": "uuid",
      "sName": "Colegio San Pablo",
      "iStudents": 45,
      "iTeachers": 5,
      "bBlocked": false
    }
  ]
}
```

**How to calculate each field:**
- `iTotalSchools`: COUNT all schools WHERE tDeletedAt IS NULL
- `iActiveSchools`: COUNT schools WHERE bBlocked = false AND tDeletedAt IS NULL
- `iInactiveSchools`: COUNT schools WHERE bBlocked = true AND tDeletedAt IS NULL
- `iTotalStudents`: SUM of all students across all active schools WHERE tDeletedAt IS NULL
- `sStudentsTrend`: Percentage change in student count vs previous period. If tStartDate and tEndDate are provided, compare against the same-length period immediately before. E.g., if filtering Mar 1-16, compare against Feb 13-28. Format: "+X.X%" or "-X.X%". Return "" if no previous period data.
- `iGoalProgress`: AVG(dProgress) across ALL active goals, rounded to integer (0-100)
- `sGoalsTrend`: Same logic as sStudentsTrend but for goals completion rate
- `dAvgStudents`: AVG students per active school (decimal, 1 decimal place)
- `dAvgTeachers`: AVG school users with sType='FACULTY' per active school
- `dAvgAdminStaff`: AVG school users with sType='ADMINISTRATION' per active school
- `aChartLabels`: Array of month abbreviations in Spanish for the months within the date range. Default to last 6 months if no date range. Use: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
- `aGoalsTotalByMonth`: COUNT of goals created per month in range
- `aGoalsCompletedByMonth`: COUNT of goals with sStatus='COMPLETED' per month in range (by tCompletedDate)
- `aRecentSchools`: Last 5 schools created, ordered by created_at DESC. Each with iStudents (COUNT students) and iTeachers (COUNT school users with sType='FACULTY')

**Date filter logic:**
- If `tStartDate` AND `tEndDate` provided: filter all counts/aggregations to that date range
- If not provided: default to current month (1st of month to today)
- Trend calculations compare current period vs same-length previous period

---

### BUG 2: GET /schools — Missing Usage Counts
**Endpoint:** `GET /schools`
**Problem:** Response returns `iUsersLimit` and `iStudentsLimit` but NOT the current usage count.

**Current response per school:**
```json
{
  "sSchoolId": "uuid",
  "sName": "Colegio",
  "iUsersLimit": 30,
  "iStudentsLimit": 300,
  "bBlocked": false
}
```

**REQUIRED response per school (add these fields):**
```json
{
  "sSchoolId": "uuid",
  "sName": "Colegio",
  "sPhone": "+521234567890",
  "iUsersLimit": 30,
  "iUsers": 12,
  "iStudentsLimit": 300,
  "iStudents": 85,
  "bBlocked": false,
  "oImages": {
    "sm": "https://s3.../school-logo-sm.jpg"
  },
  "SchoolUser": [
    {
      sUserId: add user id.
      "sEmail": "admin@school.com"
    }
  ]
}
```

**How to calculate:**
- `iUsers`: COUNT from SchoolUsers WHERE sSchoolId = school.sSchoolId AND tDeletedAt IS NULL AND bActive = true
- `iStudents`: COUNT from Students WHERE sSchoolId = school.sSchoolId AND tDeletedAt IS NULL AND bActive = true
- `SchoolUser`: Return the FIRST school user (the admin created with the school). Query: SchoolUsers WHERE sSchoolId = school.sSchoolId ORDER BY created_at ASC LIMIT 1
- `oImages.sm`: The school logo URL. If `sLogoKey` exists, generate signed S3 URL or public URL
- Add other image sizes that come with this.

---

### BUG 3: GET /schools/{id} — Missing Detail Fields
**Endpoint:** `GET /schools/{id}`
**Problem:** Missing usage counts, goal stats, and admin info.

**REQUIRED response:**
```json
{
  "message": "Success",
  "school": {
    "sSchoolId": "uuid",
    "sName": "Colegio San Pablo",
    "sPhone": "+521234567890",
    "bBlocked": false,
    "iUsersLimit": 30,
    "iUsers": 12,
    "iStudentsLimit": 300,
    "iStudents": 85,
    "iGoals": 34,
    "sGoalsProgress": "67",
    "created_at": "2026-01-15T10:30:00Z",
    "oImages": {
      "md": "https://s3.../school-logo-md.jpg"
    },
    "SchoolUser": [
      {
        "sName": "María",
        "sLastName": "González",
        "sSecondLastName": "López",
        "sEmail": "maria@school.com"
      }
    ]
  },
  "success": true
}
```

**How to calculate new fields:**
- `iUsers`: COUNT SchoolUsers for this school (active, not deleted)
- `iStudents`: COUNT Students for this school (active, not deleted)
- `iGoals`: COUNT Goals for students of this school WHERE sStatus = 'ACTIVE' AND tDeletedAt IS NULL
- `sGoalsProgress`: AVG(dProgress) of active goals for students of this school, as string integer "0"-"100"
- `SchoolUser`: First school user (the admin), with name fields and email

---

### BUG 4: S3 Image URLs Not Loading (CORS / Access Policy)
**Endpoint:** `POST /schools/{id}/image` and any response returning image URLs
**Problem:** Image URLs in `oImages.sm` and `oImages.md` don't load in the browser.

**Likely causes:**
1. S3 bucket CORS policy missing `Access-Control-Allow-Origin`
2. S3 bucket policy doesn't allow public read
3. Signed URLs expired or not generated

**Fix needed:**
- Ensure S3 bucket has CORS configuration allowing the frontend origin
- Either use public URLs with proper bucket policy OR generate pre-signed URLs with sufficient expiration (e.g., 7 days)
- Return properly accessible URLs in `oImages` field
- REVIEW if we need to do something in code or in bucket.

---

### BUG 5: GET /students — Missing Student Limit
**Endpoint:** `GET /students`
**Problem:** Response doesn't include `iStudentsLimit` from the school.

**REQUIRED response:**
```json
{
  "aData": [...],
  "iTotalItems": 85,
  "iStudentsLimit": 300
}
```

**How:** When a SchoolAdmin calls GET /students, look up the school from the token, then include `Schools.iStudentsLimit` in the response.

---

### BUG 6: GET /schools/analytics — Date Filters Not Working
**Endpoint:** `GET /schools/analytics?tStartDate=2026-03-01&tEndDate=2026-03-16`
**Problem:** Changing the date range doesn't affect the response data at all.

**Fix:** All aggregations (student counts, goal counts, trend calculations, chart data) must be filtered by the date range. See Bug 1 for full calculation details.

---

## 3. Missing: School Users (SchoolUser) CRUD

The frontend has a complete Users module (list, add, edit, detail) that is currently running on **100% hardcoded dummy data**. No API calls exist. This entire module needs backend endpoints.

### 3.1 GET /schoolUsers — List School Users

**Auth:** SchoolAdmin token (school derived from token)
**Method:** GET
**URL:** `/schoolUsers`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `iPageNumber` | integer | No | 1 | Page number (1-based) |
| `iItemsPerPage` | integer | No | 10 | Items per page |
| `sSearch` | string | No | null | Search by name or email (case-insensitive, partial match) |
| `sType` | string | No | null | Filter by type: `FACULTY` or `ADMINISTRATION` |
| `bActive` | boolean | No | null | Filter by active status |

**Business Rules:**
- School is derived from the authenticated user's token (NOT passed as param)
- Only return users belonging to the same school
- Soft-deleted users (tDeletedAt IS NOT NULL) are excluded
- Search should match against: sName, sLastName, sSecondLastName, sEmail (ILIKE %term%)

**Response:**
```json
{
  "message": "Success",
  "aData": [
    {
      "sSchoolUserId": "uuid",
      "sName": "Laura",
      "sLastName": "González",
      "sSecondLastName": "Pérez",
      "sFullName": "Laura González Pérez",
      "sEmail": "laura@school.com",
      "sType": "FACULTY",
      "bVerified": true,
      "bActive": true
    }
  ],
  "iTotalItems": 12,
  "iCurrentUsers": 12,
  "iMaxUsers": 30,
  "success": true
}
```

**Computed fields:**
- `sFullName`: TRIM(CONCAT_WS(' ', sName, sLastName, sSecondLastName)). 
- `iCurrentUsers`: COUNT of active, non-deleted school users for this school
- `iMaxUsers`: The school's `iUsersLimit` value

**SQL sketch:**
```sql
SELECT su.*, TRIM(CONCAT_WS(' ', su."sName", su."sLastName", su."sSecondLastName")) as "sFullName"
FROM "SchoolUsers" su
WHERE su."sSchoolId" = :schoolId
  AND su."tDeletedAt" IS NULL
  AND (:sSearch IS NULL OR (su."sName" ILIKE :search OR su."sLastName" ILIKE :search OR su."sEmail" ILIKE :search))
  AND (:sType IS NULL OR su."sType" = :sType)
ORDER BY su.created_at DESC
LIMIT :limit OFFSET :offset
```

---

### 3.2 POST /schoolUsers — Create School User

**Auth:** SchoolAdmin token
**Method:** POST
**URL:** `/schoolUsers`

**Request Body:**
```json
{
  "sName": "Roberto",
  "sLastName": "Hernández",
  "sSecondLastName": "Ruiz",
  "sEmail": "roberto@school.com",
  "sType": "FACULTY"
}
```

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sName` | string | YES | Non-empty, max 255 |
| `sLastName` | string | YES | Non-empty, max 255 |
| `sSecondLastName` | string | NO | Max 255 |
| `sEmail` | string | YES | Valid email format |
| `sType` | string | YES | Must be `FACULTY` or `ADMINISTRATION` |

**Business Rules:**
1. School derived from token
2. Check email uniqueness: sEmail must be unique WITHIN the school (composite unique: sSchoolId + sEmail). Same email can exist in different schools.
3. Check user limit: COUNT active users for school must be < school.iUsersLimit. If at limit, return 403 with message "Se ha alcanzado el límite de usuarios para este colegio"
4. Generate a recovery token (sTokenType = 'INITIAL_SETUP') in SchoolUserRecoverySessions
5. Send invitation email to sEmail with a link: `{frontendUrl}/set-password/{token}`
6. Set bVerified = false, bActive = true, sPassword = null
7. Set sCreatedBy = authenticated user's sSchoolUserId

**Response (201):**
```json
{
  "message": "Usuario creado exitosamente. Se ha enviado un correo de invitación.",
  "oData": {
    "sSchoolUserId": "uuid",
    "sName": "Roberto",
    "sLastName": "Hernández",
    "sSecondLastName": "Ruiz",
    "sEmail": "roberto@school.com",
    "sType": "FACULTY",
    "bVerified": false,
    "bActive": true
  },
  "success": true
}
```

---

### 3.3 GET /schoolUsers/{sSchoolUserId} — Get One School User

**Auth:** SchoolAdmin token
**Method:** GET
**URL:** `/schoolUsers/{sSchoolUserId}`

**Business Rules:**
- Verify the user belongs to the same school as the authenticated user
- Return 404 if not found or belongs to different school

**Response:**
```json
{
  "message": "Success",
  "oData": {
    "sSchoolUserId": "uuid",
    "sName": "Laura",
    "sLastName": "González",
    "sSecondLastName": "Pérez",
    "sFullName": "Laura González Pérez",
    "sEmail": "laura@school.com",
    "sType": "FACULTY",
    "bVerified": true,
    "bActive": true,
    "created_at": "2026-01-15T10:30:00Z"
  },
  "success": true
}
```

---

### 3.4 PUT /schoolUsers/{sSchoolUserId} — Update School User

**Auth:** SchoolAdmin token
**Method:** PUT
**URL:** `/schoolUsers/{sSchoolUserId}`

**Request Body:**
```json
{
  "sName": "Laura Updated",
  "sLastName": "González",
  "sSecondLastName": "Pérez",
  "sType": "ADMINISTRATION",
  "bActive": false
}
```

**Business Rules:**
- Email CANNOT be changed (immutable after creation)
- If `bActive` is set to false, all active sessions for this user should be invalidated
- Set sLastUpdatedBy = authenticated user's sSchoolUserId
- Verify user belongs to same school

**Field Validations:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sName` | string | YES | Non-empty, max 255 |
| `sLastName` | string | YES | Non-empty, max 255 |
| `sSecondLastName` | string | NO | Max 255 |
| `sType` | string | YES | `FACULTY` or `ADMINISTRATION` |
| `bActive` | boolean | NO | If provided, update status |

**Response:**
```json
{
  "message": "Usuario actualizado exitosamente.",
  "success": true
}
```

---

### 3.5 POST /schoolUsers/{sSchoolUserId}/resetPassword — Reset Password

**Auth:** SchoolAdmin token
**Method:** POST
**URL:** `/schoolUsers/{sSchoolUserId}/resetPassword`

**Request Body:** None (empty)

**Business Rules:**
1. Verify user belongs to same school
2. Generate a recovery token (sTokenType = 'RESET') in SchoolUserRecoverySessions
3. Set tExpiresAt = NOW() + 24 hours
4. Send password reset email with link: `{frontendUrl}/set-password/reset-{token}`
5. Invalidate any previous active recovery sessions for this user

**Response:**
```json
{
  "message": "Se ha enviado un correo para restablecer la contraseña.",
  "success": true
}
```

---

## 4. Missing: Tracking Records CRUD

This is the **most critical missing feature**. The entire goal progress tracking system depends on it. Currently the frontend stores records only in memory — they're lost on page refresh.

### Database Table: TrackingRecords
Already exists in migrations (2106_TrackingRecords.ts):
```
sTrackingRecordId (UUID, PK)
sGoalId (UUID, FK → Goals)
sGoalTaskId (UUID, FK → GoalTasks, nullable)
tRecordDate (date, nullable)
sSupportUsed (string: INDEPENDENT|GENERAL|VISUAL|VERBAL|WRITTEN|GESTURAL|MODELING|PHYSICAL)
sObservations (text)
iHits (integer, nullable)        — Frontend calls this "iCorrect"
iErrors (integer, nullable)      — Frontend uses iTotal = iHits + iErrors
iScaleValue (integer, nullable)
iOccurrences (integer, nullable) — Frontend calls this "iFrequencyCount"
iDurationMinutes (integer, nullable)
iAchieved (integer, nullable)    — Frontend calls this "iSuccessful"
iTotal (integer, nullable)       — Frontend calls this "iOpportunities"
sCreatedBy, sLastUpdatedBy (UUID)
bActive (boolean)
tDeletedAt (timestamp)
created_at, updated_at
```

### CRITICAL: Field Name Mapping (Frontend → Backend)

| Frontend Field | Backend DB Column | Notes |
|---------------|-------------------|-------|
| `iCorrect` | `iHits` | EXACTITUD type |
| `iTotal` (in EXACTITUD context) | Computed: `iHits + iErrors` | Frontend sends iCorrect and iTotal; backend stores iHits and iErrors |
| `iFrequencyCount` | `iOccurrences` | FRECUENCIA type |
| `iSuccessful` | `iAchieved` | OPORTUNIDAD type |
| `iOpportunities` | `iTotal` | OPORTUNIDAD type |
| `iDurationMinutes` | `iDurationMinutes` | DURACION type (matches) |
| `iScaleValue` | `iScaleValue` | ESCALA type (matches) |
| `aTasksCompleted` | Multiple rows with sGoalTaskId | TAREAS type — see below |
| `dtDate` | `tRecordDate` | Date prefix mapping |
| `sNotes` | `sObservations` | Field rename |
| `bExcludedFromAverage` | NEEDS NEW COLUMN | Does not exist yet — must add |

### IMPORTANT: TAREAS (Tasks) Type Records

For TAREAS measurement type, the frontend sends `aTasksCompleted: ["taskId1", "taskId2"]` — an array of completed task IDs. The backend needs to handle this specially:

**BEST SOLUTION AND Recommendation:** Add a `aTasksCompleted` JSON column to TrackingRecords, or create a `TrackingRecordTasks` junction table:
```sql
CREATE TABLE "TrackingRecordTasks" (
  "sTrackingRecordTaskId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sTrackingRecordId" UUID REFERENCES "TrackingRecords",
  "sGoalTaskId" UUID REFERENCES "GoalTasks",
  created_at TIMESTAMP DEFAULT NOW()
);

```

### IMPORTANT: Add bExcludedFromAverage Column

The frontend allows teachers to exclude individual records from the progress average. This needs a new column:

```sql
ALTER TABLE "TrackingRecords" ADD COLUMN "bExcludedFromAverage" BOOLEAN DEFAULT false;
```

---

### 4.1 POST /trackingRecords — Create Tracking Record

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** POST
**URL:** `/trackingRecords`

**IMPORTANT:** The frontend RecordForm sends data using FRONTEND field names. The backend must accept these and map them to DB columns internally. Below are the exact payloads the frontend sends:

**Request Body (EXACTITUD type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "Good session today",
  "iCorrect": 7,
  "iTotal": 10
}
```
Backend mapping: `dtDate → tRecordDate`, `sNotes → sObservations`, `iCorrect → iHits`, compute `iErrors = iTotal - iCorrect`

**Request Body (TAREAS type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "Completed 3 of 5 tasks",
  "aTasksCompleted": ["task-uuid-1", "task-uuid-2", "task-uuid-3"]
}
```

**Request Body (ESCALA type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "Showed improvement",
  "iScaleValue": 4
}
```

**Request Body (FRECUENCIA type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "5 incidents today",
  "iFrequencyCount": 5
}
```
Backend mapping: `iFrequencyCount → iOccurrences`

**Request Body (DURACION type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "Sustained attention for 25 min",
  "iDurationMinutes": 25
}
```

**Request Body (OPORTUNIDAD type):**
```json
{
  "sGoalId": "goal-uuid",
  "dtDate": "2026-03-15",
  "sNotes": "8 out of 10 trials successful",
  "iSuccessful": 8,
  "iOpportunities": 10
}
```
Backend mapping: `iSuccessful → iAchieved`, `iOpportunities → iTotal`

**Summary of field mapping (request → database):**
| Frontend sends | DB column | Type |
|---------------|-----------|------|
| `dtDate` | `tRecordDate` | All types |
| `sNotes` | `sObservations` | All types |
| `iCorrect` | `iHits` | EXACTITUD |
| `iTotal` (EXACTITUD) | Compute `iErrors = iTotal - iCorrect` | EXACTITUD |
| `iFrequencyCount` | `iOccurrences` | FRECUENCIA |
| `iSuccessful` | `iAchieved` | OPORTUNIDAD |
| `iOpportunities` | `iTotal` | OPORTUNIDAD |
| `iScaleValue` | `iScaleValue` | ESCALA (same) |
| `iDurationMinutes` | `iDurationMinutes` | DURACION (same) |

**Business Rules:**
1. Validate sGoalId exists and belongs to a student in the user's school
2. Validate the goal's sStatus = 'ACTIVE' (cannot add records to completed goals)
3. Validate type-specific fields are present based on the goal's sMeasurementType
4. For TAREAS: validate all task IDs in aTasksCompleted belong to the goal
5. Set sCreatedBy = authenticated user's ID
6. **After creating record: recalculate goal's dProgress and update the Goals table**
7. Update goal's iRecordsCount = iRecordsCount + 1
8. Update goal's tLastRecord = tRecordDate

**Progress Recalculation (CRITICAL):**
After each record creation, recalculate the goal's `dProgress`:

```
1. Get last 3 non-excluded records for this goal (ORDER BY tRecordDate DESC, WHERE bExcludedFromAverage = false, LIMIT 3)
2. Calculate percentage for each record based on measurement type:
   - EXACTITUD: (iHits / (iHits + iErrors)) * 100
   - TAREAS: (COUNT of aTasksCompleted / total goal tasks) * 100
   - ESCALA: (iScaleValue / goal.iScaleMax) * 100
   - FRECUENCIA: ((goal.iBaselineValue - iOccurrences) / (goal.iBaselineValue - goal.iTargetValue)) * 100
     NOTE: iBaselineValue defaults to 10 if not set on goal. This needs a new column on Goals table.
   - DURACION: (iDurationMinutes / goal.iTargetDuration) * 100
   - OPORTUNIDAD: (iAchieved / iTotal) * 100
3. Average the percentages
4. Cap at 100 (MIN(average, 100))
5. UPDATE Goals SET dProgress = calculated_value WHERE sGoalId = :goalId
```

**Response (201):**

**IMPORTANT: Return BOTH backend and frontend field names** to avoid mapping issues. The frontend reads these exact field names from each record object:

```json
{
  "message": "Registro guardado exitosamente.",
  "oData": {
    "sTrackingRecordId": "uuid",
    "sRecordId": "uuid",
    "sGoalId": "goal-uuid",
    "tRecordDate": "2026-03-15",
    "dtDate": "2026-03-15",
    "dtCreatedAt": "2026-03-15T14:30:00Z",
    "sObservations": "Good session today",
    "sNotes": "Good session today",
    "bExcludedFromAverage": false,
    "iHits": 7,
    "iCorrect": 7,
    "iErrors": 3,
    "iTotal": 10,
    "iScaleValue": null,
    "iOccurrences": null,
    "iFrequencyCount": null,
    "iDurationMinutes": null,
    "iAchieved": null,
    "iSuccessful": null,
    "iOpportunities": null,
    "aTasksCompleted": [],
    "aDocuments": [],
    "created_at": "2026-03-15T14:30:00Z"
  },
  "dUpdatedProgress": 87.5,
  "success": true
}
```

**The frontend accesses these specific field names on record objects:**
- `oRecord.sRecordId` — unique identifier
- `oRecord.dtDate` — record date
- `oRecord.sNotes` — notes/observations
- `oRecord.bExcludedFromAverage` — exclusion flag
- `oRecord.iCorrect` — EXACTITUD correct count
- `oRecord.iTotal` — EXACTITUD total count (iCorrect + iErrors)
- `oRecord.iScaleValue` — ESCALA scale value
- `oRecord.iFrequencyCount` — FRECUENCIA occurrences
- `oRecord.iDurationMinutes` — DURACION minutes
- `oRecord.iSuccessful` — OPORTUNIDAD successful count
- `oRecord.iOpportunities` — OPORTUNIDAD total attempts
- `oRecord.aTasksCompleted` — TAREAS completed task IDs
- `oRecord.aDocuments` — attached documents array

---

### 4.2 GET /goals/{sGoalId}/trackingRecords — Get Records for Goal

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** GET
**URL:** `/goals/{sGoalId}/trackingRecords`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `iPageNumber` | integer | No | 1 | Page number |
| `iItemsPerPage` | integer | No | 50 | Items per page |
| `tStartDate` | string | No | null | Filter records from this date |
| `tEndDate` | string | No | null | Filter records until this date |

**Business Rules:**
- Validate goal belongs to a student in the user's school
- Order by tRecordDate DESC (newest first)
- Include associated task completions for TAREAS type
- Include associated files (documents)
- Exclude soft-deleted records

**Response:**
```json
{
  "message": "Success",
  "aData": [
    {
      "sTrackingRecordId": "uuid",
      "sRecordId": "uuid",
      "sGoalId": "goal-uuid",
      "tRecordDate": "2026-03-15",
      "dtDate": "2026-03-15",
      "sObservations": "Good session",
      "sNotes": "Good session",
      "iHits": 7,
      "iCorrect": 7,
      "iErrors": 3,
      "iTotal": 10,
      "iScaleValue": null,
      "iOccurrences": null,
      "iFrequencyCount": null,
      "iDurationMinutes": null,
      "iAchieved": null,
      "iSuccessful": null,
      "bExcludedFromAverage": false,
      "aTasksCompleted": [],
      "aDocuments": [
        {
          "sFileId": "uuid",
          "sFileName": "evidence.pdf",
          "sFileType": "application/pdf",
          "File": {
            "sKey": "https://s3.../evidence.pdf"
          }
        }
      ],
      "created_at": "2026-03-15T14:30:00Z"
    }
  ],
  "iTotalItems": 15,
  "success": true
}
```

---

### 4.3 PATCH /trackingRecords/{sTrackingRecordId}/toggleExclusion — Toggle Record Exclusion

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** PATCH
**URL:** `/trackingRecords/{sTrackingRecordId}/toggleExclusion`

**Request Body:**
```json
{
  "bExcludedFromAverage": true
}
```

**Business Rules:**
1. Toggle the bExcludedFromAverage field
2. **Recalculate the parent goal's dProgress** (same formula as in 4.1)
3. Return the updated progress value

**Response:**
```json
{
  "message": "Registro excluido del promedio.",
  "dUpdatedProgress": 82.3,
  "success": true
}
```

---

### 4.4 DELETE /trackingRecords/{sTrackingRecordId} — Delete Record

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** DELETE
**URL:** `/trackingRecords/{sTrackingRecordId}`

**Business Rules:**
1. Soft-delete (set tDeletedAt = NOW())
2. Recalculate parent goal's dProgress
3. Update goal's iRecordsCount = iRecordsCount - 1

**Response:**
```json
{
  "message": "Registro eliminado.",
  "dUpdatedProgress": 75.0,
  "success": true
}
```

---

## 5. Missing: Record Documents (RecordFiles)

Teachers can attach evidence files (photos, PDFs) to individual tracking records.

### 5.1 POST /trackingRecords/{sTrackingRecordId}/files — Upload Record Files

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** POST
**URL:** `/trackingRecords/{sTrackingRecordId}/files`
**Content-Type:** multipart/form-data

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `oFile` | File[] | One or more files (max 10MB each) |
| `sArrFileNames` | string[] | Original filenames |

**Supported file types:** image/*, application/pdf, .doc, .docx, .xls, .xlsx
**Max file size:** 10MB per file

**Response (201):**
```json
{
  "message": "Archivos subidos exitosamente.",
  "aFiles": [
    {
      "sFileId": "uuid",
      "sFileName": "evidence.pdf",
      "sFileType": "application/pdf",
      "File": {
        "sKey": "https://s3.../evidence.pdf"
      }
    }
  ],
  "success": true
}
```

---

### 5.2 GET /trackingRecords/{sTrackingRecordId}/files — List Record Files

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** GET

**Response:**
```json
{
  "aData": [
    {
      "sFileId": "uuid",
      "sFileName": "photo.jpg",
      "sFileType": "image/jpeg",
      "File": {
        "sKey": "https://s3.../photo.jpg"
      }
    }
  ],
  "success": true
}
```

---

### 5.3 DELETE /trackingRecords/{sTrackingRecordId}/files/{sFileId} — Delete Record File

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** DELETE

**Business Rules:**
- Delete from S3 and from database
- Verify file belongs to the specified record

**Response:**
```json
{
  "message": "Archivo eliminado.",
  "success": true
}
```

---

## 6. Missing: IEP Persistence

The IEP (Individualized Education Plan) is currently only stored in frontend memory. It needs backend persistence.

### New Database Table Needed: IEPs

```sql
CREATE TABLE "IEPs" (
  "sIepId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sStudentId" UUID NOT NULL REFERENCES "Students"("sStudentId"),
  "sStatus" VARCHAR(20) DEFAULT 'DRAFT',

  -- External Services (stored as JSON array)
  "aExternalServices" JSONB DEFAULT '[]',

  -- Parents
  "sParentNames" TEXT DEFAULT '',
  "sParentConcerns" TEXT DEFAULT '',

  -- School Assignment
  "sSchoolAssignment" VARCHAR(50) DEFAULT '',
  "sSchoolAssignmentOther" TEXT DEFAULT '',

  -- Student Profile
  "sStrengths" TEXT DEFAULT '',
  "sAreasOfOpportunity" TEXT DEFAULT '',

  -- Academic Performance
  "sCognitiveEvaluations" TEXT DEFAULT '',
  "sSubjectGrades" TEXT DEFAULT '',
  "sEvaluationResults" TEXT DEFAULT '',

  -- Functional Performance
  "sCommunicationComments" TEXT DEFAULT '',
  "sMotorComments" TEXT DEFAULT '',
  "sSocioemotionalComments" TEXT DEFAULT '',
  "sIndependenceComments" TEXT DEFAULT '',

  -- Focus Areas (stored as JSON array of strings)
  "aFocusAreas" JSONB DEFAULT '[]',
  "sFocusAreasSubjects" TEXT DEFAULT '',

  -- Accommodations (stored as JSON array of strings)
  "aAccommodations" JSONB DEFAULT '[]',
  "sOtherAccommodations" TEXT DEFAULT '',

  -- Modifications
  "bRequiresModifications" BOOLEAN DEFAULT false,
  "aModifications" JSONB DEFAULT '[]',

  -- Objectives (stored as JSON array)
  "aObjectives" JSONB DEFAULT '[]',

  -- Audit
  "sCreatedBy" UUID REFERENCES "SchoolUsers"("sSchoolUserId"),
  "sLastUpdatedBy" UUID REFERENCES "SchoolUsers"("sSchoolUserId"),
  "bActive" BOOLEAN DEFAULT true,
  "tDeletedAt" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "IEPs_sStudentId_idx" ON "IEPs"("sStudentId");
```

**JSON structures for JSONB columns:**

`aExternalServices`:
```json
[
  {
    "sServiceId": "uuid",
    "sServiceType": "Terapia del Lenguaje",
    "sProfessional": "Dr. García",
    "sFrequency": "2 veces por semana"
  }
]
```

`aModifications`:
```json
[
  {
    "sModificationId": "uuid",
    "dtDate": "2026-03-15",
    "sAreaModified": "Matemáticas",
    "sChangeType": "Reducción de complejidad",
    "sReason": "Dificultad con fracciones",
    "sResponsible": "Prof. López",
    "sComments": ""
  }
]
```

`aObjectives`:
```json
[
  {
    "sObjectiveId": "uuid",
    "sSubjectArea": "Lectura",
    "sCurrentPerformance": "Lee a nivel de 2do grado",
    "sShortTermObjective": "Leer a nivel de 3er grado en 6 meses",
    "sProgressLevel": "PARTIAL",
    "sProgressGraphLink": "",
    "sProgressSummary": "Ha mejorado en fluidez",
    "sLinkedGoalId": "goal-uuid-or-null"
  }
]
```

`sSchoolAssignment` valid values:
```
GENERAL, GENERAL_ACCOMMODATIONS, GENERAL_SHARED_MONITOR, GENERAL_MODIFICATIONS,
GENERAL_MONITOR, MIXED_15, SPECIAL_8_GENERAL_EXTRA, SPECIAL_8_SPECIAL_EXTRA,
SPECIAL_8_MONITOR, SPECIAL_SMALL_MONITOR, SPECIAL_INDIVIDUAL, OTHER
```

`aFocusAreas` valid values:
```
ACADEMIC, MOTOR, COMMUNICATION, SOCIOEMOTIONAL, COGNITIVE, ADAPTIVE
```

`aAccommodations` valid values (33 options across 5 categories):
```
PRESELECTED_SEAT, REPEAT_INSTRUCTIONS, TRANSITION_TIME, ACTIVITY_TIME, SENSORY_BREAKS,
FLOOR_SEAT, ALPHABET_DESK, DIFFERENT_PENCIL, PENCIL_GRIP, SLANTED_BOARD, LARGER_MANIPULATIVES, LARGER_LINES,
MAGNIFIER, LARGER_FONT, HIGH_CONTRAST, TRACKING_TOOL, VERBAL_INSTRUCTIONS, MULTIPLE_READS,
PROMOTE_OPTIONS, BEHAVIOR_REMINDERS, CALMING_CORNER, TOKEN_ECONOMY, MOVEMENT_BREAKS, SENSORY_TOOLS, VISUAL_SELF_REG,
DESK_CHECKLIST, DISTRACTION_FOLDER, WORD_BANK, CONCEPT_MAPS, INDIVIDUAL_TIMER, SHORT_STEPS, HIGHLIGHT_MAIN, COLOR_CODING
```

`sProgressLevel` valid values:
```
NONE, LIMITED, PARTIAL, SUBSTANTIAL, COMPLETED
```

---

### FRONTEND INTEGRATION NOTE

The student detail page (`/admin/students/[id]/index.vue`) currently does **NOT** call any IEP API endpoint. The `oIep` data is initialized as `null` and only set when the user saves the IEP form locally. For backend integration:

1. The student detail page must call `GET /students/{sStudentId}/iep` on mount
2. If IEP data is returned, pass it as `oInitialIep` prop to the IepForm component
3. The IepForm `save` event handler must call `POST /students/{sStudentId}/iep` with the full IEP object
4. Set `bHasIep = true` after successful save (currently shown in StudentDetail component as "Tiene IEP" / "Sin IEP")

**NOTE:** The IEP interface uses `dtCreatedAt` / `dtUpdatedAt` on the frontend, but the backend should return `created_at` / `updated_at` (Knex standard). The frontend will need to map these, or the backend can return both.

---

FOR IEPS, CREATE A NEW SUBMODULE CALLED IEPS, DO NOT DO THEM WITHIN STUDENTS MODULE.. INSTEAD, SEND STUDENT ID IN BODY AND IN REQ QUERY IN THE GETS.. HELP CHANGE THIS..
### 6.1 POST /students/{sStudentId}/iep — Create or Update IEP

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** POST
**URL:** `/students/{sStudentId}/iep`

**Request Body:** The full IEP object (see IIep interface above)

**Business Rules:**
- If student already has an IEP (non-deleted): UPDATE it
- If no IEP exists: CREATE a new one
- This is an "upsert" pattern — the frontend calls POST regardless of create/update
- Set sCreatedBy or sLastUpdatedBy accordingly
- Validate student belongs to user's school

**Response:**
```json
{
  "message": "IEP guardado exitosamente.",
  "oData": {
    "sIepId": "uuid",
    "sStudentId": "student-uuid",
    "sStatus": "DRAFT",
    "dtUpdatedAt": "2026-03-16T10:30:00Z"
  },
  "success": true
}
```

---

### 6.2 GET /students/{sStudentId}/iep — Get Student's IEP

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** GET
**URL:** `/students/{sStudentId}/iep`

**Business Rules:**
- Return the active (non-deleted) IEP for this student
- If no IEP exists, return 200 with `oData: null` (NOT 404)
- Validate student belongs to user's school

**Response (IEP exists):**
```json
{
  "message": "Success",
  "oData": {
    "sIepId": "uuid",
    "sStudentId": "student-uuid",
    "sStatus": "DRAFT",
    "aExternalServices": [...],
    "sParentNames": "Juan y María Pérez",
    "sParentConcerns": "...",
    "sSchoolAssignment": "GENERAL_ACCOMMODATIONS",
    "sSchoolAssignmentOther": "",
    "sStrengths": "...",
    "sAreasOfOpportunity": "...",
    "sCognitiveEvaluations": "...",
    "sSubjectGrades": "...",
    "sEvaluationResults": "...",
    "sCommunicationComments": "...",
    "sMotorComments": "...",
    "sSocioemotionalComments": "...",
    "sIndependenceComments": "...",
    "aFocusAreas": ["ACADEMIC", "COMMUNICATION"],
    "sFocusAreasSubjects": "Matemáticas, Lectura",
    "aAccommodations": ["PRESELECTED_SEAT", "REPEAT_INSTRUCTIONS"],
    "sOtherAccommodations": "",
    "bRequiresModifications": false,
    "aModifications": [],
    "aObjectives": [...],
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-03-16T10:30:00Z"
  },
  "success": true
}
```

**Response (No IEP):**
```json
{
  "message": "Success",
  "oData": null,
  "success": true
}
```

---

## 7. Missing: Profile Management

The profile page currently uses `setTimeout` mocks. Needs real endpoints.

**CRITICAL NOTE:** The profile page reads `oUser.sPhone` from the auth store, but the current IUser interface does NOT include `sPhone`. Two things must happen:
1. The login response must include `sPhone` (see Section 9.4)
2. The frontend login.vue must map `sPhone: oResults.sPhone || ''` into the user object
3. After profile save, the frontend should update the auth store with the new data

The profile Card.vue component emits:
- `save` event with `{ sName, sEmail, sPhone }` (sEmail is read-only)
- `save-password` event with `{ sCurrentPassword, sNewPassword, sConfirmPassword }`

### 7.1 PUT /profile — Update Own Profile

**Auth:** Any authenticated user (SuperAdmin or SchoolUser)
**Method:** PUT
**URL:** `/profile`

**Request Body:**
```json
{
  "sName": "Samuel",
  "sPhone": "+521234567890"
}
```

**Business Rules:**
- User ID derived from token (no ID in URL)
- Email CANNOT be changed (sent by frontend but should be ignored or rejected)
- Only name and phone can be updated
- Works for both SuperAdmin and SchoolUser
- After success, frontend will update the auth store locally

**Response:**
```json
{
  "message": "Perfil actualizado exitosamente.",
  "success": true
}
```

---

### 7.2 PUT /profile/password — Change Own Password

**Auth:** Any authenticated user
**Method:** PUT
**URL:** `/profile/password`

**Request Body:**
```json
{
  "sCurrentPassword": "oldPassword123",
  "sNewPassword": "newPassword456",
  "sConfirmPassword": "newPassword456"
}
```

**Business Rules:**
1. Verify sCurrentPassword matches stored hash
2. sNewPassword must meet requirements (enforced by frontend PasswordRequirements component):
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)
3. sNewPassword and sConfirmPassword must match
4. Hash and store new password
5. Invalidate all other active sessions for this user (optional, security best practice)

**NOTE:** The Postman collection shows `auth/setPassword` accepts min 6 chars. The frontend enforces min 8 + complexity. Backend should enforce the same rules as frontend (8 chars + complexity) for consistency.

**Response:**
```json
{
  "message": "Contraseña actualizada exitosamente.",
  "success": true
}
```

**Error (wrong current password):**
```json
{
  "message": "La contraseña actual es incorrecta.",
  "success": false
}
```

---

## 8. Missing: Reports / Student Analytics

The Reports tab on the student detail page needs data. Currently it uses goals and empty records.

### 8.1 GET /students/{sStudentId}/report — Get Student Progress Report

**Auth:** SchoolAdmin/Teacher/Staff token
**Method:** GET
**URL:** `/students/{sStudentId}/report`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `tStartDate` | string | No | First day of current month | Start of reporting period |
| `tEndDate` | string | No | Today | End of reporting period |

**Business Rules:**
- Validate student belongs to user's school
- Aggregate goal and record data for the date range
- Calculate summary statistics

**Response:**
```json
{
  "message": "Success",
  "oData": {
    "oStudent": {
      "sStudentId": "uuid",
      "sFullName": "Carlos Martínez López",
      "sGrade": "3ro Primaria",
      "sGroup": "A"
    },
    "oSummary": {
      "iTotalGoals": 5,
      "iActiveGoals": 3,
      "iCompletedGoals": 1,
      "iNotAchievedGoals": 1,
      "iTotalRecords": 45,
      "dAverageProgress": 72.5,
      "iOverdueGoals": 1
    },
    "aGoals": [
      {
        "sGoalId": "uuid",
        "sTitle": "Mejorar lectura",
        "sStatus": "ACTIVE",
        "sMeasurementType": "EXACTITUD",
        "dProgress": 87.5,
        "tStartDate": "2026-01-15",
        "tTargetDate": "2026-06-15",
        "tCompletedDate": null,
        "iTargetValue": 80,
        "iScaleMax": null,
        "aGoalTasks": [],
        "aRecords": [
          {
            "sTrackingRecordId": "uuid",
            "tRecordDate": "2026-03-15",
            "iHits": 7,
            "iCorrect": 7,
            "iErrors": 3,
            "iTotal": 10,
            "sObservations": "Good session",
            "bExcludedFromAverage": false
          }
        ]
      }
    ]
  },
  "success": true
}
```

**Calculation details:**
- `iTotalGoals`: COUNT all goals (active + completed + not_achieved) for student
- `iActiveGoals`: COUNT WHERE sStatus = 'ACTIVE'
- `iCompletedGoals`: COUNT WHERE sStatus = 'COMPLETED' AND tCompletedDate BETWEEN tStartDate AND tEndDate
- `iNotAchievedGoals`: COUNT WHERE sStatus = 'NOT_ACHIEVED' AND tCompletedDate BETWEEN tStartDate AND tEndDate
- `iTotalRecords`: COUNT tracking records WHERE tRecordDate BETWEEN tStartDate AND tEndDate
- `dAverageProgress`: AVG(dProgress) of active goals
- `iOverdueGoals`: COUNT WHERE sStatus = 'ACTIVE' AND tTargetDate < TODAY
- `aGoals`: All goals with their records filtered by date range. Include both frontend and backend field names.

---

## 9. Enhancements to Existing Endpoints

### 9.1 Goals Table — Add Baseline Value Column

The FRECUENCIA measurement type needs a baseline value to calculate progress. Currently hardcoded to 10 on the frontend.

```sql
ALTER TABLE "Goals" ADD COLUMN "iBaselineValue" INTEGER DEFAULT 10;
```

The frontend GoalForm already sends this in the payload — the backend just needs to store it.

---

### 9.2 GET /goals/{sGoalId} — Include Records in Response

Currently the goal detail endpoint only returns goal data. The frontend needs records too.

**Add to response:**
```json
{
  "goal": {
    "sGoalId": "...",
    "...": "...",
    "aTrackingRecords": [
      {
        "sTrackingRecordId": "uuid",
        "sRecordId": "uuid",
        "tRecordDate": "2026-03-15",
        "dtDate": "2026-03-15",
        "iHits": 7,
        "iCorrect": 7,
        "iErrors": 3,
        "iTotal": 10,
        "sObservations": "...",
        "sNotes": "...",
        "bExcludedFromAverage": false,
        "aTasksCompleted": [],
        "aDocuments": []
      }
    ]
  }
}
```

Alternatively, keep records in a separate endpoint (GET /goals/{id}/trackingRecords) and let the frontend make two calls. **Either approach works** — the frontend already handles both patterns.

---

### 9.3 GET /goals/student/{sStudentId} — Include Goal Tasks Inline

The frontend normalizes `GoalTasks` to `aGoalTasks`. Make sure the response includes tasks:

```json
{
  "aData": [
    {
      "sGoalId": "uuid",
      "sTitle": "...",
      "dProgress": 75,
      "sStatus": "ACTIVE",
      "GoalTasks": [
        {
          "sGoalTaskId": "uuid",
          "sTitle": "Task 1",
          "bCompleted": true,
          "iOrder": 1
        }
      ]
    }
  ]
}
```

---

### 9.4 Login Response — Include Permissions Array

The frontend permission system checks `aPermissions` array. Make sure login response includes:

```json
{
  "results": {
    "sUserId": "uuid",
    "sToken": "jwt...",
    "sEmail": "user@school.com",
    "sFullName": "Full Name",
    "sUserType": "SchoolAdmin",
    "sPhone": "+521234567890",
    "oSchool": {
      "sSchoolId": "uuid",
      "sSchoolName": "Colegio San Pablo",
      "sSchoolLogo": "https://s3.../logo.jpg"
    },
    "aPermissions": [
      {
        "sModuleId": "uuid",
        "sModuleName": "Students",
        "sAction": "WRITE"
      },
      {
        "sModuleId": "uuid",
        "sModuleName": "Goals",
        "sAction": "DELETE"
      }
    ]
  }
}
```

**CRITICAL: Permission field is `sAction`, NOT `sActionCode`.** The frontend IPermission interface is:
```typescript
interface IPermission {
  sModuleId: string;
  sModuleName: string;
  sAction: 'READ' | 'WRITE' | 'DELETE';
}
```

The frontend permission hierarchy: DELETE > WRITE > READ. If a user has WRITE, they implicitly have READ. If they have DELETE, they have WRITE and READ.

**CRITICAL: Login response must include `sPhone`.** The frontend profile page reads `oUser.sPhone` from the auth store. The login.vue currently maps:
```javascript
const oUser = {
  sUserId: oResults.sUserId,
  sEmail: oResults.sEmail,
  sName: oResults.sFullName,       // NOTE: maps sFullName → sName
  sFullName: oResults.sFullName,
  sUserType: oResults.sUserType,
  sSchoolId: oResults.oSchool?.sSchoolId || '',
  sSchoolName: oResults.oSchool?.sSchoolName || '',
  sSchoolLogo: oResults.oSchool?.sSchoolLogo || '',
  aPermissions: oResults.aPermissions || [],
};
```
The frontend will need to also map `sPhone: oResults.sPhone || ''` — but this requires `sPhone` in the login response. For SuperAdmins this comes from the SuperAdmins table, for SchoolAdmins from the SchoolUsers table.

---

## 10. Field Name Mapping Reference

### General Rules
| Convention | Frontend | Backend | Direction |
|-----------|----------|---------|-----------|
| Date prefix | `dt` (dtStartDate) | `t` (tStartDate) | Frontend maps dt→t when sending |
| Timestamps | `dtCreatedAt` | `created_at` | Frontend reads created_at |
| IDs | Same | `s{TableName}Id` | Match |

### Schools Module
| Frontend | Backend | Notes |
|----------|---------|-------|
| `sAdminName` (single) | `sName`, `sLastName`, `sSecondLastName` | Frontend splits for creation |
| `sAdminEmail` | `sEmail` | Different field name |
| `oLogo` (File) | `sImageKey` (S3 key) | Upload via /schools/{id}/image |
| `iUsers` (display) | Computed COUNT | Backend must compute |
| `iStudents` (display) | Computed COUNT | Backend must compute |

### Students Module
| Frontend | Backend | Notes |
|----------|---------|-------|
| `sBirthYear` (string in form) | `iBirthYear` (integer) | Frontend parses to int |
| `sFullName` | Computed | Backend: TRIM(CONCAT_WS) |
| `iAge` | Computed | Backend: YEAR(NOW()) - iBirthYear |
| `iGoalsCount` | Computed | Backend: COUNT active goals |
| `dGoalsProgress` | Computed | Backend: AVG(dProgress) |

### Goals Module
| Frontend | Backend | Notes |
|----------|---------|-------|
| `dtStartDate` | `tStartDate` | Date prefix |
| `dtTargetDate` | `tTargetDate` | Date prefix |
| `dtCompletedDate` | `tCompletedDate` | Read only |
| `dtLastRecord` | `tLastRecord` | Read only |
| `aTasks` / `aGoalTasks` | `GoalTasks` | Backend returns as `GoalTasks` |
| `sTaskId` | `sGoalTaskId` | ID convention |

### Tracking Records Module
| Frontend | Backend | Notes |
|----------|---------|-------|
| `sRecordId` | `sTrackingRecordId` | ID convention |
| `dtDate` | `tRecordDate` | Date prefix |
| `sNotes` | `sObservations` | Field rename |
| `iCorrect` | `iHits` | EXACTITUD type |
| `iTotal` (EXACTITUD) | `iHits + iErrors` | Computed |
| `iFrequencyCount` | `iOccurrences` | FRECUENCIA type |
| `iSuccessful` | `iAchieved` | OPORTUNIDAD type |
| `iOpportunities` | `iTotal` | OPORTUNIDAD type |

### Goal Completion
| Frontend Dialog | API Body | Mapping |
|----------------|----------|---------|
| `sResult: 'ACHIEVED'` | `sStatus: 'COMPLETED'` | Map value |
| `sResult: 'NOT_ACHIEVED'` | `sStatus: 'NOT_ACHIEVED'` | Direct |
| `sNotes` | `sCompletionNotes` | Rename |

---

## 11. Database Tables Reference

### Existing Tables (from migrations)

| Table | PK | Key Columns |
|-------|-----|-------------|
| Users | sUserId | sEmail, sPassword, sName, sLastName |
| Sessions | sSessionId | sUserId, bActive, tExpiresAt |
| RecoverySessions | sRecoverySessionId | sUserId, sToken, tExpiresAt |
| AdministratorModules | sAdministratorModuleId | sName |
| Administrators | sAdministratorId (FK→Users) | |
| AdministratorPermissions | sAdministratorPermissionId | sAdministratorId, sAdministratorModuleId, sActionCode |
| Files | sFileId | sFileName, sFileKey, sFileType |
| SuperAdmins | sSuperAdminId | sEmail, sPassword, sName |
| Schools | sSchoolId | sName, sAdminEmail, iUsersLimit(new), iStudentsLimit(new), sLogoKey, bBlocked |
| SchoolUsers | sSchoolUserId | sSchoolId, sEmail, sPassword, sType, bVerified |
| Students | sStudentId | sSchoolId, sName, iBirthYear, sGrade, sDiagnosis |
| Goals | sGoalId | sStudentId, sMeasurementType, sStatus, dProgress(new) |
| GoalTasks | sGoalTaskId | sGoalId, sTitle, bCompleted, iOrder |
| TrackingRecords | sTrackingRecordId | sGoalId, tRecordDate, measurement-specific fields |
| SchoolUserRecoverySessions | sSchoolUserRecoverySessionId | sSchoolUserId, sToken, sTokenType |
| SchoolUserSessions | sSchoolUserSessionId | sSchoolUserId, sToken, tExpiresAt |
| SuperAdminSessions | sSuperAdminSessionId | sSuperAdminId, sToken, tExpiresAt |

### New Tables Needed

| Table | Purpose |
|-------|---------|
| IEPs | Store IEP documents per student |
| TrackingRecordTasks | Junction: which tasks were completed in each TAREAS record |
| TrackingRecordFiles | Files attached to individual tracking records |

### New Columns Needed on Existing Tables

| Table | Column | Type | Default | Purpose |
|-------|--------|------|---------|---------|
| Goals | iBaselineValue | INTEGER | 10 | Baseline for FRECUENCIA type progress calc |
| Goals | dProgress | DECIMAL | 0 | Calculated progress percentage |
| Goals | dAverageValue | DECIMAL | 0 | Current average from last 3 records |
| Goals | iRecordsCount | INTEGER | 0 | Count of tracking records |
| Goals | tLastRecord | DATE | NULL | Date of most recent record |
| Goals | tCompletedDate | DATE | NULL | When goal was completed |
| Goals | sCompletionNotes | TEXT | '' | Notes when completing goal |
| TrackingRecords | bExcludedFromAverage | BOOLEAN | false | Exclude from progress calculation |
| Schools | iUsersLimit | INTEGER | 30 | Max school users allowed |
| Schools | iStudentsLimit | INTEGER | 300 | Max students allowed |

**NOTE:** Some of these columns may already exist if they were added after the initial migrations. Check before adding duplicates.

---

## 12. Business Rules Reference

### Authentication
- SuperAdmin: Can access /schools, /administrators, /dashboard
- SchoolAdmin: Can access /students, /goals, /users, /profile
- Teacher: Can access /students (own school), /goals, /profile
- Staff: Can access /students (own school), /goals (read), /profile
- JWT tokens stored as Bearer tokens
- 401 response triggers auto-logout on frontend

### Schools
- School name must be unique
- Admin email must be unique across all schools
- Blocking a school (bBlocked=true) should prevent its users from logging in
- Soft delete via tDeletedAt timestamp

### School Users
- Email must be unique WITHIN a school (composite: sSchoolId + sEmail)
- Same email CAN exist in different schools
- Types: FACULTY (teacher), ADMINISTRATION (admin staff)
- User count cannot exceed school's iUsersLimit
- New users get invitation email with set-password link
- bVerified = true after first password set

### Students
- Student count cannot exceed school's iStudentsLimit
- Soft delete via tDeletedAt
- Age computed: YEAR(NOW()) - iBirthYear
- Grade values: "1° Preescolar" through "3° Secundaria" (12 levels)

### Goals
- 6 measurement types: EXACTITUD, TAREAS, ESCALA, FRECUENCIA, DURACION, OPORTUNIDAD
- Status values: ACTIVE, COMPLETED, NOT_ACHIEVED
- Progress calculated from average of last 3 non-excluded records
- Progress capped at 100%
- Goal completion is manual (teacher decides)
- Overdue: sStatus = 'ACTIVE' AND tTargetDate < TODAY
- Soft delete via tDeletedAt

### Tracking Records
- One record per session per goal
- Records can be excluded from average calculation (bExcludedFromAverage)
- After each record CRUD operation, recalculate parent goal's dProgress
- TAREAS type: store which tasks were completed in that session

### Progress Categories (for display)
| Category | Range | Description |
|----------|-------|-------------|
| Sin progreso | 0% | No progress |
| Progreso limitado | 1-45% | Limited progress |
| Progreso parcial | 46-79% | Partial progress |
| Progreso sustancial | 80-99% | Substantial progress |
| Objetivo cumplido | 100% | Goal met |

### Progress Calculation Formulas

**EXACTITUD:** `AVG(iHits / (iHits + iErrors) * 100)` from last 3 non-excluded records, then `(average / iTargetValue) * 100`, cap at 100

**TAREAS:** `AVG(completedTasks / totalTasks * 100)` from last 3 non-excluded records, progress = average (target is always 100%)

**ESCALA:** `AVG(iScaleValue)` from last 3, then `(average / iScaleMax) * 100`, cap at 100

**FRECUENCIA:** `AVG(iOccurrences)` from last 3, then `((iBaselineValue - average) / (iBaselineValue - iTargetValue)) * 100`, cap at 100. This is a REDUCTION goal — lower is better.

**DURACION:** `AVG(iDurationMinutes)` from last 3, then `(average / iTargetDuration) * 100`, cap at 100

**OPORTUNIDAD:** `AVG(iAchieved / iTotal * 100)` from last 3, then `(average / iTargetValue) * 100`, cap at 100

### IEP
- One IEP per student (upsert pattern)
- Status: DRAFT (default), ACTIVE, ARCHIVED
- All text fields are free-form
- Array fields (aFocusAreas, aAccommodations) use predefined option values
- Objectives can link to Goals via sLinkedGoalId
- PDF generation is 100% client-side (no backend PDF needed)

---

## APPENDIX: Response Format Convention

All API responses should follow this structure:

**Success:**
```json
{
  "message": "Descriptive success message in Spanish",
  "success": true,
  "oData": { ... }
}
```

**List:**
```json
{
  "message": "Success",
  "success": true,
  "aData": [ ... ],
  "iTotalItems": 100,
  "iPageNumber": 1,
  "iItemsPerPage": 10
}
```

**Error:**
```json
{
  "message": "Descriptive error message in Spanish",
  "success": false
}
```

**NOTE:** The frontend currently handles multiple response formats (response.data.school, response.data.results, response.data.oData, response.data directly). Going forward, standardize on `oData` for single entities and `aData` for lists. The frontend will adapt.

---

---

## 13. Frontend Integration Notes

These are critical details discovered by auditing every frontend file against this guide.

### 13.1 Response Format Fallback Chains

The frontend uses multiple fallback patterns when parsing API responses. The backend should standardize on ONE format, but these are the chains the frontend currently handles:

| Context | Fallback Chain |
|---------|---------------|
| Single school | `response.data.school \|\| response.data.results \|\| response.data` |
| Single student | `response.data.student \|\| response.data.results \|\| response.data` |
| Single goal | `response.data.goal \|\| response.data.results \|\| response.data` |
| School list | `response.data.schools` |
| Student list | `response.data.aData \|\| response.data.students` |
| Goals list | `response.data.goals \|\| response.data.aData \|\| response.data.results` |
| Goal tasks | `response.data.goalTasks \|\| response.data.aData \|\| response.data.results` |

**Recommendation:** Standardize on `oData` for single entities and `aData` for lists. The frontend handles the fallbacks so either format works, but consistency helps.

### 13.2 Goal Detail Page — Record Loading

The goal detail page (`/admin/students/[id]/goals/[goalId]/index.vue`) currently:
1. Fetches goal data: `GET /goals/{sGoalId}`
2. Fetches goal tasks: `GET /goals/{sGoalId}/goalTasks`
3. Fetches goal files: `GET /goals/{sGoalId}/goalFiles`
4. Does NOT fetch tracking records (hardcoded as empty array)

**For backend integration, the page needs to add:**
5. `GET /goals/{sGoalId}/trackingRecords` — to load all records for the goal

The record creation mock currently does:
```javascript
const oNewRecord = {
  sRecordId: `new-${Date.now()}`,
  sGoalId: this.oGoal.sGoalId,
  dtCreatedAt: new Date().toISOString(),
  ...oRecordData,  // Spread the RecordForm data
};
this.aRecords.unshift(oNewRecord);
this.oGoal.iRecordsCount++;
```
This must be replaced with `POST /trackingRecords`, then prepend the response to the local array.

### 13.3 GoalCard Required Fields

The GoalCard component accesses these fields from the goal object for display. ALL must be present in `GET /goals/student/{id}` response:

```
sGoalId             — Required for routing and folio generation
sTitle              — Card title
sDescription        — Card description (truncated)
sMeasurementType    — Type label and icon
sStatus             — Status badge (ACTIVE, COMPLETED, NOT_ACHIEVED)
tTargetDate         — Target date display and overdue calculation
dProgress           — Progress bar fill (0-100)
dAverageValue       — Average display for FRECUENCIA/DURACION types
iTargetValue        — Target display
iTargetDuration     — Target for DURACION type
iScaleMax           — Max for ESCALA type
iRecordsCount       — Record count in footer
aGoalTasks          — Task array (for TAREAS type task count display)
tLastRecord         — Date of last record (optional)
created_at          — Sort order (newest first)
```

### 13.4 Student Detail Stats

The student detail page computes these values from the goals response:
- `iGoalsCount = aGoals.length`
- `iCompletedGoals = aGoals.filter(g => g.sStatus === 'COMPLETED').length`
- `bHasIep` — set to true when IEP is loaded/saved (needs backend IEP endpoint)

These are NOT expected from a separate endpoint — they're derived from the goals list.

### 13.5 Reports Tab Data Flow

The Reports tab on the student detail page does NOT make its own API calls. It receives data as props:
- `aGoals` — from the goals already fetched for the Metas tab
- `aAllRecords` — currently an empty array (needs tracking records)

Once tracking records are implemented, the student detail page should:
1. Fetch all records for all goals: either via `GET /students/{id}/report` (Section 8) or by calling `GET /goals/{goalId}/trackingRecords` for each goal
2. Pass the combined records array as `aAllRecords` prop

The report component filters records by date range client-side and computes all summary stats locally.

### 13.6 Dashboard Chart Type

The dashboard uses `TrendChart` component which defaults to **bar** chart type (not line). The chart data structure is:
```javascript
aChartDatasets: [
  {
    sLabel: 'Metas totales',
    aData: [...],
    sBackgroundColor: 'rgba(10, 166, 178, 0.2)',
    sBorderColor: '#0AA6B2',
    iBorderWidth: 2,
    iBorderRadius: 6,
  },
  {
    sLabel: 'Metas completadas',
    aData: [...],
    sBackgroundColor: '#71D491',
    sBorderColor: '#71D491',
    iBorderWidth: 0,
    iBorderRadius: 6,
  },
]
```

### 13.7 Schools List — Email Fallback Chain

The schools list displays admin email with this fallback:
```javascript
row.SchoolUser?.[0]?.sEmail || row.sEmail || ''
```

The backend must include either `SchoolUser` array (with at least element [0] having `sEmail`) or `sEmail` at the root level of each school object.

### 13.8 Student List — Pagination Note

The frontend currently fetches `iPageNumber: 1, iItemsPerPage: 50` (always page 1 with 50 items). The DataTable component handles client-side pagination of those 50 items at 10 per page. For larger datasets, this needs to be changed to proper server-side pagination.

### 13.9 Goal Completion — Field Mapping Detail

When completing a goal, the frontend GoalCompleteDialog emits `{ sResult, sNotes }`. The goal detail page maps this to the API:
```javascript
{
  sStatus: oResult.sResult === 'ACHIEVED' ? 'COMPLETED' : 'NOT_ACHIEVED',
  sCompletionNotes: oResult.sNotes || undefined,
}
```
And sends to: `PATCH /goals/{sGoalId}/complete`

After success, the frontend also locally sets:
- `oGoal.sStatus = 'COMPLETED'` or `'NOT_ACHIEVED'`
- `oGoal.tCompletedDate = new Date().toISOString().split('T')[0]`
- `oGoal.dProgress = 100` (if ACHIEVED)

### 13.10 Goal Tasks in Goals List Response

When fetching goals via `GET /goals/student/{sStudentId}`, the frontend normalizes tasks with:
```javascript
aGoalTasks: oGoal.GoalTasks || oGoal.aGoalTasks || []
```

The backend returns tasks under the key `GoalTasks` (the Knex relation name). The frontend accepts either `GoalTasks` or `aGoalTasks`.

### 13.11 dProgress Parsing

The frontend parses dProgress from the API response with:
```javascript
dProgress: parseFloat(oGoal.dProgress) || 0
```
This means dProgress can come as a string or number — the frontend handles both. But it must be a valid numeric value (0-100).

### 13.12 Goal Create/Update — Task Handling by Backend

When creating a goal with TAREAS measurement type, the POST /goals payload includes:
```json
{
  "aTasks": [
    { "sTitle": "Task 1", "iOrder": 1 },
    { "sTitle": "Task 2", "iOrder": 2 }
  ]
}
```
The backend MUST create GoalTask records from this array.

When updating a goal (PUT /goals/{id}), the payload includes:
```json
{
  "aTasks": [
    { "sTitle": "Task 1", "iOrder": 1, "bCompleted": false },
    { "sTitle": "Task 2", "iOrder": 2, "bCompleted": true }
  ]
}
```
The backend must reconcile: add new tasks, update existing tasks, and remove tasks that are no longer in the array.

**IMPORTANT:** The `aDocuments` field is sent in the GoalForm payload but the parent page (`add.vue` / `edit.vue`) **deletes it before sending** to the API:
```javascript
delete oPayload.aDocuments;
```
Documents are uploaded separately via `POST /goals/{sGoalId}/goalFiles` using FormData. If the backend receives `aDocuments`, it should ignore it.

### 13.13 Goal File Upload — FormData Structure

The exact FormData sent to `POST /goals/{sGoalId}/goalFiles`:
```
oFile: [File object 1]
sArrGoalFileNames: "filename1.pdf"
oFile: [File object 2]
sArrGoalFileNames: "filename2.docx"
```
Each file gets one `oFile` entry and one `sArrGoalFileNames` entry. They are appended in order (not as a single array field).

The goal file response must include:
```json
{
  "goalFiles": [
    {
      "sGoalFileId": "uuid",
      "sFileName": "document.pdf",
      "sFileType": "application/pdf",
      "File": {
        "sKey": "https://s3.../accessible-url.pdf"
      }
    }
  ]
}
```
`File.sKey` must be an accessible URL (public or pre-signed). The frontend checks `sFileType.startsWith('image/')` to determine if it's an image for preview.

### 13.14 sSupportUsed / sAllowedSupport — NOT Used by Frontend

The TrackingRecords and Goals tables have `sSupportUsed` and `sAllowedSupport` columns respectively. **The frontend does NOT use these fields at all** — no UI exists to display or set them. The backend can store them but they are backend-only fields currently.

### 13.15 School Image Sizes

The frontend expects `oImages` to be an object with size keys:
- `oImages.sm` — used in school list table (small avatar, ~36px)
- `oImages.md` — used in school detail page (larger logo)

Both must be directly accessible URLs (public S3 or pre-signed with sufficient expiration). If the URL is not accessible, the frontend shows a fallback icon.

### 13.16 Student Table — Required Computed Fields

The student list table displays these columns that require backend-computed values:

| Column | Field | Source |
|--------|-------|--------|
| Nombre | `sFullName` | Backend computed: TRIM(CONCAT_WS(' ', sName, sLastName, sSecondLastName)) |
| Grado | `sGrade` | Direct field |
| Edad | `iAge` | Backend computed: YEAR(NOW()) - iBirthYear |
| Diagnóstico | `sDiagnosis` | Direct field |
| Progreso Metas | `iGoalsCount` + `dGoalsProgress` | Backend computed from Goals table |

The progress column renders:
- If `iGoalsCount > 0`: progress bar + `dGoalsProgress%` + `(iGoalsCount)` count
- If `iGoalsCount === 0`: text "Sin metas"

### 13.17 Student Limit Display

The students list page displays limits from the GET /students response:
- `iStudentsLimit`: from the school's limit (0 = unlimited)
- `iTotalItems`: current count of students

Display: `"X / Y"` if limit exists, just count if unlimited.
Add button disabled when: `iStudentsLimit > 0 && iTotalItems >= iStudentsLimit`.
Warning badge when: remaining ≤ 10.

---

## 14. Complete Checklist — What Backend Must Deliver

### Phase 1: Fix Existing (CRITICAL)
- [ ] Fix GET /schools/analytics — return all 15 fields (Section 2, Bug 1)
- [ ] Fix GET /schools/analytics — date filters must work (Section 2, Bug 6)
- [ ] Fix GET /schools — add iUsers and iStudents counts (Section 2, Bug 2)
- [ ] Fix GET /schools/{id} — add iGoals, sGoalsProgress, iUsers, iStudents (Section 2, Bug 3)
- [ ] Fix GET /students — add iStudentsLimit from school (Section 2, Bug 5)
- [ ] Fix S3 images — CORS and access policy (Section 2, Bug 4)
- [ ] Fix auth/login — include sPhone in response (Section 9.4)
- [ ] Fix auth/login — permissions as `sAction` not `sActionCode` (Section 9.4)
- [ ] Fix auth/setPassword — enforce 8-char + complexity requirements (Section 7.2)
- [ ] Add iBaselineValue column to Goals table (Section 9.1)
- [ ] Add bExcludedFromAverage column to TrackingRecords table (Section 4)
- [ ] Add dProgress, dAverageValue, iRecordsCount, tLastRecord, tCompletedDate, sCompletionNotes to Goals if missing (Section 11)

### Phase 2: New Endpoints (CRITICAL)
- [ ] POST /trackingRecords — create tracking record (Section 4.1)
- [ ] GET /goals/{id}/trackingRecords — list records for goal (Section 4.2)
- [ ] PATCH /trackingRecords/{id}/toggleExclusion — toggle record exclusion (Section 4.3)
- [ ] DELETE /trackingRecords/{id} — delete record (Section 4.4)
- [ ] Progress recalculation after every record CRUD operation (Section 4.1 business rules)

### Phase 3: New Endpoints (HIGH)
- [ ] GET /schoolUsers — list school users (Section 3.1)
- [ ] POST /schoolUsers — create school user with invitation email (Section 3.2)
- [ ] GET /schoolUsers/{id} — get single user (Section 3.3)
- [ ] PUT /schoolUsers/{id} — update user (Section 3.4)
- [ ] POST /schoolUsers/{id}/resetPassword — reset password email (Section 3.5)
- [ ] POST /students/{id}/iep — create/update IEP (Section 6.1)
- [ ] GET /students/{id}/iep — get student IEP (Section 6.2)
- [ ] PUT /profile — update own profile (Section 7.1)
- [ ] PUT /profile/password — change own password (Section 7.2)

### Phase 4: New Endpoints (MEDIUM)
- [ ] POST /trackingRecords/{id}/files — upload record files (Section 5.1)
- [ ] GET /trackingRecords/{id}/files — list record files (Section 5.2)
- [ ] DELETE /trackingRecords/{id}/files/{fileId} — delete record file (Section 5.3)
- [ ] GET /students/{id}/report — student progress report (Section 8.1)
- [ ] Create IEPs database table (Section 6)
- [ ] Create TrackingRecordTasks junction table (Section 4, TAREAS type)

---

CREATE A GUIDE CALLED march18Changes2026.md  that states all of the changes that we will do that front-end needs to consider, for now, i only see the change that we will do to IEP... use the back-end context and the front-end context in myVillage folder to do this.. Help.

*End of Backend Integration Guide v1.2*
