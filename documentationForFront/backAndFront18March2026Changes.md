# Backend & Frontend Changes — March 18, 2026

**Version:** 1.0
**Date:** 2026-03-18
**Base URL:** `{{baseUrl}}/api/v1/sp`

---

# SECTION 1: BACKEND CHANGES

## 1.1 NEW ENDPOINTS

---

### 1.1.1 Tracking Records

#### POST `/trackingRecords` — Create Tracking Record

**Auth:** SchoolUser (Goals WRITE)
**Content-Type:** application/json

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sGoalId` | UUID | YES | Goal this record belongs to |
| `dtDate` | date (YYYY-MM-DD) | NO | Record date |
| `sNotes` | string | NO | Observations/notes |
| `iCorrect` | integer | NO | Correct count (EXACTITUD type) |
| `iTotal` | integer | NO | Total count (EXACTITUD type) |
| `iScaleValue` | integer | NO | Scale value (ESCALA type) |
| `iFrequencyCount` | integer | NO | Frequency count (FRECUENCIA type) |
| `iDurationMinutes` | integer | NO | Duration in minutes (DURACION type) |
| `iSuccessful` | integer | NO | Successful count (OPORTUNIDAD type) |
| `iOpportunities` | integer | NO | Total attempts (OPORTUNIDAD type) |
| `aTasksCompleted` | UUID[] | NO | Completed task IDs (TAREAS type) |

**Note:** Unknown fields are allowed and ignored (e.g. `aFiles` from frontend is silently stripped).

**Response (201):**
```json
{
  "message": "Registro guardado exitosamente.",
  "oData": {
    "sTrackingRecordId": "uuid",
    "sRecordId": "uuid",
    "sGoalId": "uuid",
    "tRecordDate": "2026-03-18",
    "dtDate": "2026-03-18",
    "dtCreatedAt": "2026-03-18T14:30:00Z",
    "sObservations": "...",
    "sNotes": "...",
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
    "aDocuments": []
  },
  "dUpdatedProgress": 87.5,
  "success": true
}
```

**Business Rules:**
1. Goal must exist and have `sStatus = 'ACTIVE'` (400 if not active)
2. Goal's student must belong to the authenticated user's school
3. Field mapping: `iCorrect→iHits`, `iTotal-iCorrect→iErrors`, `iFrequencyCount→iOccurrences`, `iSuccessful→iAchieved`, `iOpportunities→iTotal`, `dtDate→tRecordDate`, `sNotes→sObservations`
4. For TAREAS type: creates junction records in `TrackingRecordTasks` table
5. After insert: increments `Goals.iRecordsCount` and sets `Goals.tLastRecord`
6. After insert: recalculates `Goals.dProgress` using last 3 non-excluded records

---

#### GET `/goals/{sGoalId}/trackingRecords` — List Records for Goal

**Auth:** SchoolUser (General READ)

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `iPageNumber` | integer | 1 | Page number |
| `iItemsPerPage` | integer | 50 | Items per page |
| `tStartDate` | date | null | Filter from date |
| `tEndDate` | date | null | Filter to date |

**Response (200):**
```json
{
  "message": "Se han encontrado los registros!",
  "aData": [
    {
      "sTrackingRecordId": "uuid",
      "sRecordId": "uuid",
      "dtDate": "2026-03-18",
      "sNotes": "...",
      "iCorrect": 7,
      "iTotal": 10,
      "iScaleValue": null,
      "iFrequencyCount": null,
      "iDurationMinutes": null,
      "iSuccessful": null,
      "iOpportunities": null,
      "bExcludedFromAverage": false,
      "aTasksCompleted": ["task-uuid-1"],
      "aDocuments": [
        {
          "sFileId": "uuid",
          "sFileName": "evidence.pdf",
          "sFileType": "pdf",
          "File": { "sKey": "https://s3.../signed-url" }
        }
      ]
    }
  ],
  "iTotalItems": 15,
  "success": true
}
```

**Business Rules:**
1. Goal must exist and its student must belong to the authenticated school
2. Only returns active, non-deleted records (`bActive=true`, `tDeletedAt IS NULL`)
3. Sorted by `tRecordDate DESC`
4. Includes file attachments from `TrackingRecordFiles` joined with `Files`
5. Includes task completions from `TrackingRecordTasks`

---

#### PATCH `/trackingRecords/{sTrackingRecordId}/toggleExclusion` — Toggle Record Exclusion

**Auth:** SchoolUser (Goals WRITE)

**Request Body:**
```json
{ "bExcludedFromAverage": true }
```

**Response (200):**
```json
{
  "message": "Se actualizó la exclusión del registro exitosamente.",
  "dUpdatedProgress": 82.3,
  "success": true
}
```

**Business Rules:**
1. Record must exist and be active
2. Goal's student must belong to authenticated school
3. After toggle: recalculates `Goals.dProgress`

---

#### DELETE `/trackingRecords/{sTrackingRecordId}` — Delete Tracking Record

**Auth:** SchoolUser (Goals WRITE)

**Response (200):**
```json
{
  "message": "Registro eliminado.",
  "dUpdatedProgress": 75.0,
  "success": true
}
```

**Business Rules:**
1. Soft delete: sets `bActive=false`, `tDeletedAt=NOW()`
2. Decrements `Goals.iRecordsCount` (minimum 0)
3. Recalculates `Goals.dProgress`

---

#### POST `/trackingRecords/{sTrackingRecordId}/files` — Upload Record Files

**Auth:** SchoolUser (Goals WRITE)
**Content-Type:** multipart/form-data

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `oFile` | File[] | One or more files |
| `sArrFileNames` | string[] | Original filenames (one per file) |

**Response (201):**
```json
{
  "message": "Archivos subidos exitosamente.",
  "aFiles": [
    {
      "sFileId": "uuid",
      "sFileName": "evidence.pdf",
      "sFileType": "pdf",
      "File": { "sKey": "https://s3.../signed-url" }
    }
  ],
  "success": true
}
```

**Business Rules:**
1. Record must exist and be active
2. Files stored in S3 at: `{sSchoolId}/recordFiles/{sTrackingRecordId}/`
3. Creates entry in `Files` table + `TrackingRecordFiles` junction

---

#### GET `/trackingRecords/{sTrackingRecordId}/files` — List Record Files

**Auth:** SchoolUser (Goals READ)

**Response (200):**
```json
{
  "message": "Se han encontrado los registros!",
  "aData": [
    {
      "sTrackingRecordFileId": "uuid",
      "sTrackingRecordId": "uuid",
      "File": {
        "sFileId": "uuid",
        "sFileName": "photo.jpg",
        "sFileType": "jpeg",
        "sFileKey": "...",
        "sFileUrl": "https://s3.../signed-url"
      }
    }
  ],
  "success": true
}
```

---

#### DELETE `/trackingRecords/{sTrackingRecordId}/files/{sFileId}` — Delete Record File

**Auth:** SchoolUser (Goals WRITE)

**Response (200):**
```json
{
  "message": "Se eliminó el archivo de la meta!",
  "success": true
}
```

**Business Rules:**
1. File must belong to the specified record (verified via junction table)
2. Soft deletes from `Files` table (`bActive=false`)
3. Deletes from S3

---

### 1.1.2 IEP Module

#### POST `/iep` — Create or Update IEP (Upsert)

**Auth:** SchoolUser (General WRITE)

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sStudentId` | UUID | YES | Student this IEP belongs to |
| `sStatus` | enum | NO | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| `aExternalServices` | array | NO | External therapy services |
| `sParentNames` | string | NO | Parent names |
| `sParentConcerns` | string | NO | Parent concerns |
| `sSchoolAssignment` | string | NO | School placement type |
| `sSchoolAssignmentOther` | string | NO | Other placement details |
| `sStrengths` | string | NO | Student strengths |
| `sAreasOfOpportunity` | string | NO | Areas of opportunity |
| `sCognitiveEvaluations` | string | NO | Cognitive eval results |
| `sSubjectGrades` | string | NO | Subject grades |
| `sEvaluationResults` | string | NO | Evaluation results |
| `sCommunicationComments` | string | NO | Communication notes |
| `sMotorComments` | string | NO | Motor skills notes |
| `sSocioemotionalComments` | string | NO | Socioemotional notes |
| `sIndependenceComments` | string | NO | Independence notes |
| `aFocusAreas` | string[] | NO | Focus area codes |
| `sFocusAreasSubjects` | string | NO | Focus subjects |
| `aAccommodations` | string[] | NO | Accommodation codes |
| `sOtherAccommodations` | string | NO | Other accommodations |
| `bRequiresModifications` | boolean | NO | Whether modifications needed |
| `aModifications` | array | NO | Modification records |
| `aObjectives` | array | NO | IEP objectives |

**Response (201):**
```json
{
  "message": "IEP guardado exitosamente.",
  "oData": {
    "sIepId": "uuid",
    "sStudentId": "uuid",
    "sStatus": "DRAFT",
    "dtUpdatedAt": "2026-03-18T10:30:00Z"
  },
  "success": true
}
```

**Business Rules:**
1. Student must belong to authenticated school
2. If student already has an active IEP: UPDATE existing
3. If no IEP exists: CREATE new one
4. Sets `sCreatedBy` or `sLastUpdatedBy` accordingly

---

#### GET `/iep?sStudentId=xxx` — Get Student's IEP

**Auth:** SchoolUser (General READ)

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `sStudentId` | UUID | YES | Student ID |

**Response (200) — IEP exists:**
```json
{
  "message": "Se ha encontrado la información del IEP.",
  "oData": { ...full IEP object with all fields... },
  "success": true
}
```

**Response (200) — No IEP:**
```json
{
  "message": "Se ha encontrado la información del IEP.",
  "oData": null,
  "success": true
}
```

**Business Rules:**
1. Student must belong to authenticated school
2. Returns `null` if no IEP exists (NOT 404)

---

### 1.1.3 School Users CRUD

#### GET `/schoolUsers` — List School Users

**Auth:** SchoolUser (General READ)

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `iPageNumber` | integer | 1 | Page number |
| `iItemsPerPage` | integer | 10 | Items per page |
| `sSearch` | string | null | Search by name or email |
| `sType` | enum | null | `FACULTY` or `ADMINISTRATION` |
| `bActive` | boolean | null | Filter by active status |

**Response (200):**
```json
{
  "message": "Se han encontrado los usuarios!",
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

**Business Rules:**
1. School derived from authenticated user's token
2. Only returns users belonging to the same school
3. `sType` derived from `Users.sCreatedBy`: `NULL` = ADMINISTRATION, `NOT NULL` = FACULTY
4. `iCurrentUsers` = count of active users; `iMaxUsers` = school's `iUsersLimit`

---

#### POST `/schoolUsers` — Create School User

**Auth:** SchoolUser (General WRITE)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sName` | string | YES | Non-empty |
| `sLastName` | string | YES | Non-empty |
| `sSecondLastName` | string | NO | |
| `sEmail` | string | YES | Valid email format |
| `sType` | enum | YES | `FACULTY` or `ADMINISTRATION` |

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

**Business Rules:**
1. Check user limit: active users must be < `school.iUsersLimit` (403 if at limit)
2. Email must be unique within the school
3. Creates entry in `Users` table + `SchoolUsers` junction
4. Generates recovery token (72-hour expiry)
5. Sends invitation email with set-password link
6. New user: `bVerified=false`, `bPlatformAccess=false`, `sPassword=null`

---

#### GET `/schoolUsers/{sSchoolUserId}` — Get One School User

**Auth:** SchoolUser (General READ)

**Response (200):**
```json
{
  "message": "Se ha encontrado la información del usuario.",
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

**Business Rules:**
1. User must belong to authenticated school (404 if not found or different school)

---

#### PUT `/schoolUsers/{sSchoolUserId}` — Update School User

**Auth:** SchoolUser (General WRITE)

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sName` | string | YES | |
| `sLastName` | string | YES | |
| `sSecondLastName` | string | NO | |
| `sType` | enum | YES | `FACULTY` or `ADMINISTRATION` |
| `bActive` | boolean | NO | If set to false, kills all sessions |

**Response (200):**
```json
{
  "message": "Usuario actualizado exitosamente.",
  "success": true
}
```

**Business Rules:**
1. Email is immutable (cannot be changed)
2. If `bActive=false`: invalidates all active sessions for the user (forces logout)
3. User must belong to authenticated school

---

#### POST `/schoolUsers/{sSchoolUserId}/resetPassword` — Reset Password

**Auth:** SchoolUser (General WRITE)
**Request Body:** Empty

**Response (200):**
```json
{
  "message": "Se ha enviado un correo para restablecer la contraseña.",
  "success": true
}
```

**Business Rules:**
1. User must belong to authenticated school
2. Generates recovery token (24-hour expiry)
3. Sends password reset email with link

---

### 1.1.4 Profile

#### PUT `/profile` — Update Own Profile

**Auth:** SchoolUser (General READ)

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| `sName` | string | YES |
| `sPhone` | string | NO |

**Response (200):**
```json
{
  "message": "Perfil actualizado exitosamente.",
  "success": true
}
```

**Business Rules:**
1. Updates the authenticated user's own profile
2. `sPhone` maps to `Users.sPhoneNumber`

---

#### PUT `/profile/password` — Change Own Password

**Auth:** SchoolUser (General READ)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sCurrentPassword` | string | YES | Must match stored hash |
| `sNewPassword` | string | YES | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (!@#$%^&*) |
| `sConfirmPassword` | string | YES | Must match `sNewPassword` |

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente.",
  "success": true
}
```

**Error (400 — wrong password):**
```json
{
  "message": "La contraseña actual es incorrecta.",
  "success": false
}
```

---

### 1.1.5 Student Report

#### GET `/students/{sStudentId}/report` — Student Progress Report

**Auth:** SchoolUser (General READ)

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `tStartDate` | date | 1st of current month | Start of period |
| `tEndDate` | date | Today | End of period |

**Response (200):**
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
        "sTitle": "...",
        "sStatus": "ACTIVE",
        "dProgress": 87.5,
        "aGoalTasks": [...],
        "aRecords": [
          {
            "sRecordId": "uuid",
            "dtDate": "2026-03-15",
            "iCorrect": 7,
            "iTotal": 10,
            "sNotes": "..."
          }
        ]
      }
    ]
  },
  "success": true
}
```

---

## 1.2 CHANGED ENDPOINTS

---

### 1.2.1 GET `/schools/analytics` — Enhanced Response + Date Filters

**What changed:**
- Now accepts `tStartDate` and `tEndDate` query parameters
- Returns 6 new fields: `sStudentsTrend`, `sGoalsTrend`, `aChartLabels`, `aGoalsTotalByMonth`, `aGoalsCompletedByMonth`
- `iGoalProgress` now calculated as AVG(dProgress) of active goals (was completion rate)
- Trend calculations compare current period vs same-length previous period

**New query params:**
| Param | Type | Default |
|-------|------|---------|
| `tStartDate` | date | 1st of current month |
| `tEndDate` | date | Today |

**New response fields:**
| Field | Type | Description |
|-------|------|-------------|
| `sStudentsTrend` | string | "+5.2%" or "-3.1%" |
| `sGoalsTrend` | string | Same format |
| `aChartLabels` | string[] | ["Ene", "Feb", "Mar", ...] |
| `aGoalsTotalByMonth` | integer[] | Goals created per month |
| `aGoalsCompletedByMonth` | integer[] | Goals completed per month |

---

### 1.2.2 GET `/schools` — Added Computed Fields

**New fields per school in response:**
| Field | Type | Description |
|-------|------|-------------|
| `iUsers` | integer | Count of active school users |
| `iStudents` | integer | Count of active students |
| `SchoolUser[0].sUserId` | string | Admin user's ID (new) |

---

### 1.2.3 GET `/schools/{id}` — Added Computed Fields

**New fields in school response:**
| Field | Type | Description |
|-------|------|-------------|
| `iUsers` | integer | Count of active school users |
| `iStudents` | integer | Count of active students |
| `iGoals` | integer | Count of active goals |
| `sGoalsProgress` | string | AVG progress as "0"-"100" |

---

### 1.2.4 GET `/students` — Added iStudentsLimit

**New response fields:**
| Field | Type | Description |
|-------|------|-------------|
| `iStudentsLimit` | integer | School's student limit |
| `aData` | array | Same as `students` (standardized key) |
| `iTotalItems` | integer | Same as `iTotal` (standardized key) |

---

### 1.2.5 POST `/auth/login` — Added sPhone & aPermissions

**New fields in `results`:**
| Field | Type | Description |
|-------|------|-------------|
| `sPhone` | string | User's phone number (from `Users.sPhoneNumber`) |
| `aPermissions` | array | `[{ sModuleId, sModuleName, sAction }]` |

**Permissions logic:**
- Super school admin (`Users.sCreatedBy IS NULL`): gets full permissions automatically
- Regular school user: permissions fetched from `SchoolPermissions` joined with `SchoolModules`
- Field is `sAction` (not `sActionCode`)

---

### 1.2.6 Goals — iBaselineValue Added

**New field in `POST /goals` and `PUT /goals/{id}` body:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `iBaselineValue` | integer | 10 | Baseline for FRECUENCIA type progress calculation |

---

## 1.3 PROGRESS RECALCULATION (Business Rule)

After every tracking record CREATE, DELETE, or TOGGLE EXCLUSION, the goal's `dProgress` is recalculated:

1. Get last 3 non-excluded records (`bExcludedFromAverage=false`) sorted by `tRecordDate DESC`
2. Calculate percentage for each record based on measurement type:
   - **EXACTITUD:** `(iHits / (iHits + iErrors)) * 100`
   - **TAREAS:** `(completedTasks / totalGoalTasks) * 100`
   - **ESCALA:** `(iScaleValue / goal.iScaleMax) * 100`
   - **FRECUENCIA:** `((iBaselineValue - iOccurrences) / (iBaselineValue - iTargetValue)) * 100`
   - **DURACION:** `(iDurationMinutes / goal.iTargetDuration) * 100`
   - **OPORTUNIDAD:** `(iAchieved / iTotal) * 100`
3. Average the percentages
4. Cap at 100
5. Update `Goals.dProgress` and `Goals.dAverageValue`

---

## 1.4 DATABASE MIGRATIONS

| Migration | Description |
|-----------|-------------|
| `3021_TrackingRecords.ts` | TrackingRecords table (all measurement fields + bExcludedFromAverage) |
| `3022_TrackingRecordTasks.ts` | Junction table for TAREAS type task completions |
| `3023_Goals_iBaselineValue.ts` | Adds `iBaselineValue` column to Goals (default 10) |
| `3024_IEPs.ts` | Full IEP table with all sections (JSONB fields for arrays) |
| `3025_TrackingRecordFiles.ts` | Junction table linking TrackingRecords to Files |

Run: `npm run db:migrations`

---

## 1.5 FIELD MAPPING REFERENCE (Frontend → Backend)

| Frontend sends | Backend stores | Type |
|---------------|----------------|------|
| `dtDate` | `tRecordDate` | All types |
| `sNotes` | `sObservations` | All types |
| `iCorrect` | `iHits` | EXACTITUD |
| `iTotal` (EXACTITUD) | Computed: `iErrors = iTotal - iCorrect` | EXACTITUD |
| `iFrequencyCount` | `iOccurrences` | FRECUENCIA |
| `iSuccessful` | `iAchieved` | OPORTUNIDAD |
| `iOpportunities` | `iTotal` | OPORTUNIDAD |
| `iScaleValue` | `iScaleValue` | ESCALA (same) |
| `iDurationMinutes` | `iDurationMinutes` | DURACION (same) |
| `aTasksCompleted` | `TrackingRecordTasks` rows | TAREAS |

**Response returns BOTH field names** (backend + frontend) for compatibility.

---

---

# SECTION 2: FRONTEND CHANGES

## 2.1 login.vue — Added sPhone Mapping

**File:** `app/pages/login.vue`

**Change:** Added `sPhone` to the user object mapping from login response.

**Before:**
```javascript
const oUser = {
  sUserId: oResults.sUserId,
  sEmail: oResults.sEmail,
  sName: oResults.sFullName,
  sFullName: oResults.sFullName,
  sUserType: oResults.sUserType,
  // ... school fields + aPermissions
};
```

**After:**
```javascript
const oUser = {
  sUserId: oResults.sUserId,
  sEmail: oResults.sEmail,
  sName: oResults.sFullName,
  sFullName: oResults.sFullName,
  sPhone: oResults.sPhone || '',    // ← NEW
  sUserType: oResults.sUserType,
  // ... school fields + aPermissions
};
```

---

## 2.2 Goal Detail — Replaced Mock Records with API Calls

**File:** `app/pages/admin/students/[id]/goals/[goalId]/index.vue`

**Changes:**
1. Removed comment `"Tracking records kept as dummy data — no API endpoint yet"`
2. Added `fetchTrackingRecords()` method — calls `GET /goals/{goalId}/trackingRecords` on mount
3. Replaced `handleSaveRecord()` — was `setTimeout` mock, now:
   - **Step 1:** `POST /trackingRecords` with record data (files stripped from payload)
   - Updates local `aRecords` array, increments `iRecordsCount`, updates `dProgress` from `dUpdatedProgress`
   - **Step 2:** If files were attached, calls `uploadRecordFiles()`
4. Added `uploadRecordFiles()` method — sends files via `POST /trackingRecords/{id}/files` as `multipart/form-data`

---

## 2.3 Users List — Replaced Hardcoded Data with API

**File:** `app/pages/admin/users/index.vue`

**Changes:**
1. Removed 4 hardcoded dummy user objects from `aUsers` data
2. Changed `iCurrentUsers` and `iMaxUsers` from hardcoded values (4, 30) to 0 (populated by API)
3. Added `mounted()` hook calling `fetchUsers()`
4. Added `fetchUsers()` method — calls `GET /schoolUsers` with pagination/search/filter params
5. Maps response: `aData → aUsers`, `iCurrentUsers`, `iMaxUsers`

---

## 2.4 User Add — Replaced Mock with API

**File:** `app/pages/admin/users/add.vue`

**Change:** Replaced `setTimeout` mock in `handleSubmit()` with `POST /schoolUsers` API call. Redirects to `/admin/users` on success.

---

## 2.5 User Detail — Replaced Hardcoded Data with API

**File:** `app/pages/admin/users/[id]/index.vue`

**Changes:**
1. Removed hardcoded `aUsers` array (4 dummy users)
2. Replaced `setTimeout` mock in `fetchUser()` with `GET /schoolUsers/{id}` API call
3. Response mapped from `oData || results || data`

---

## 2.6 User Edit — Replaced Hardcoded Data with API

**File:** `app/pages/admin/users/[id]/edit.vue`

**Changes:**
1. Removed hardcoded `aUsers` array (4 dummy users)
2. Replaced `setTimeout` mock in `fetchUser()` with `GET /schoolUsers/{id}` API call
3. Replaced `setTimeout` mock in `handleSubmit()` with `PUT /schoolUsers/{id}` API call

---

## 2.7 Profile — Replaced Mocks with API

**File:** `app/pages/admin/profile.vue`

**Changes:**

**handleSaveProfile:**
- Was: `setTimeout` mock with success alert
- Now: `PUT /profile` with `{ sName, sPhone }`. Updates auth store locally after success (`authStore.oUser.sName`, `sFullName`, `sPhone`).

**handleSavePassword:**
- Was: `setTimeout` mock with success alert
- Now: `PUT /profile/password` with `{ sCurrentPassword, sNewPassword, sConfirmPassword }`.

---

## 2.8 IEP Form — Replaced Mock with API

**File:** `app/components/iep/Form.vue`

**Change in `saveIep()`:**
- Was: `setTimeout` mock (800ms) with local state update
- Now: `POST /iep` with full IEP object including `sStudentId` from `this.oStudent`. Updates timestamps and emits `save` event on success.

---

## 2.9 Student Detail — Added IEP Fetch + Records Fetch

**File:** `app/pages/admin/students/[id]/index.vue`

**Changes:**
1. Removed comment `"Tracking records (kept as dummy — no API endpoint yet)"`
2. Added `fetchIep()` method — calls `GET /iep?sStudentId=xxx`. Sets `oIep` and `bHasIep=true` if data returned.
3. Added `fetchAllRecords()` method — calls `GET /goals/{goalId}/trackingRecords` in parallel for ALL goals (100 items each), flattens results into `aAllRecords` for the Reports tab.
4. `fetchGoals()` now calls `fetchAllRecords()` after loading goals, and `fetchIep()` at the same time.

---

## 2.10 Files NOT Changed (Already Compatible)

These files were already correctly wired up for the new backend response and needed no changes:

| File | Reason |
|------|--------|
| `pages/admin/dashboard.vue` | Already maps `sStudentsTrend`, `sGoalsTrend`, `aChartLabels`, chart data |
| `pages/admin/schools/index.vue` | Already reads `iUsers`, `iStudents` from response |
| `pages/admin/schools/[id]/index.vue` | Already reads `iGoals`, `sGoalsProgress` from response |
| `pages/admin/students/index.vue` | Already reads `iStudentsLimit` from response |
| `stores/auth.ts` | No changes needed — `sPhone` automatically persisted via `setLogin()` |

---

*End of March 18, 2026 Backend & Frontend Changes Guide*
