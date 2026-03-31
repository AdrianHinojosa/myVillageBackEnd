# MY VILLAGE — Backend Issues & Requirements (March 25, 2026)

**Purpose:** Specific issues the backend needs to fix for the frontend to work correctly. Each issue includes exact details of what's wrong, what the frontend expects, and how to fix it.

**Base URL:** `{{baseUrl}}/api/v1/sp`

---

## ISSUE 1: TAREAS Records Missing `aTasksCompleted` in Report Endpoint

**Priority:** CRITICAL — blocks report PDF generation for TAREAS goals
**Endpoint:** `GET /students/:sStudentId/report`
**Status:** Records for TAREAS-type goals come back without the `aTasksCompleted` field. The frontend cannot render charts, progress bars, or record tables for these goals.

### What currently happens (WRONG)

When the report endpoint returns goals with `sMeasurementType: "TAREAS"`, the `aRecords` array has records that look like this:

```json
{
  "sTrackingRecordId": "uuid",
  "tRecordDate": "2026-03-15",
  "sObservations": "Session notes"
}
```

There is NO `aTasksCompleted` field, so the frontend shows empty tables and flat-line charts.

### What the frontend expects (CORRECT)

Every record for a TAREAS goal MUST include `aTasksCompleted` — an array of `sGoalTaskId` strings representing which tasks were completed in that session:

```json
{
  "sTrackingRecordId": "uuid",
  "tRecordDate": "2026-03-15",
  "sObservations": "Session notes",
  "aTasksCompleted": ["task-uuid-1", "task-uuid-2", "task-uuid-3"]
}
```

### Where this field is used by the frontend

1. **Report PDF** — record table shows "3/5 tareas" per row
2. **Report charts** — each data point = `aTasksCompleted.length` for that record
3. **Goal detail page** — record list shows task completion count
4. **Goal summary** — chart plots task completion over time
5. **Progress calculation** — `(aTasksCompleted.length / iTargetValue) * 100`

### How to implement

**Option A — Junction table (if `TrackingRecordTasks` exists):**
```sql
SELECT tr.*,
  COALESCE(
    json_agg(trt."sGoalTaskId") FILTER (WHERE trt."sGoalTaskId" IS NOT NULL),
    '[]'
  ) AS "aTasksCompleted"
FROM "TrackingRecords" tr
LEFT JOIN "TrackingRecordTasks" trt ON trt."sTrackingRecordId" = tr."sTrackingRecordId"
WHERE tr."sGoalId" = :goalId
GROUP BY tr."sTrackingRecordId"
```

**Option B — JSONB column:**
```sql
ALTER TABLE "TrackingRecords" ADD COLUMN IF NOT EXISTS "aTasksCompleted" JSONB DEFAULT '[]';
```
Then just include it in the SELECT.

**The frontend handles BOTH formats:**
- `"aTasksCompleted": ["task-id-1", "task-id-2"]` — preferred
- `"TrackingRecordTasks": [{ "sGoalTaskId": "task-id-1" }, ...]` — also works

### This same fix must also apply to:

- `GET /goals/:sGoalId/trackingRecords` — record list endpoint
- `POST /trackingRecords` — must accept `aTasksCompleted` array in request body, store it, and return it in response

---

## ISSUE 2: New Field `iTargetValue` for TAREAS Goals

**Priority:** HIGH — affects progress calculation and charts
**Endpoints affected:** `POST /goals`, `PUT /goals/:id`, `GET /goals/student/:id`, `GET /students/:id/report`

### What changed

Previously, TAREAS goals assumed the target was always "complete ALL tasks" (100%). Now the teacher can set a specific target: "out of 10 tasks, the goal is to complete 5 per session."

The frontend now sends `iTargetValue` when creating/editing TAREAS goals. This field already exists on the Goals table for other measurement types — it just wasn't used for TAREAS before.

### What the backend must do

1. **Accept `iTargetValue` on `POST /goals` and `PUT /goals/:id`** for TAREAS type (it may already work since `iTargetValue` is used by other types — just verify it's stored and returned)

2. **Return `iTargetValue` in all goal responses** — specifically in:
   - `GET /goals/student/:sStudentId` (goal list)
   - `GET /goals/:sGoalId` (goal detail)
   - `GET /students/:sStudentId/report` (report goals)

3. **Update progress calculation for TAREAS:**
   ```
   OLD: (COUNT(aTasksCompleted) / total_GoalTasks) * 100
   NEW: (COUNT(aTasksCompleted) / iTargetValue) * 100
   FALLBACK: if iTargetValue is NULL, use total_GoalTasks count (old behavior)
   ```

### Example

A goal has 10 tasks and `iTargetValue: 5`. A record with `aTasksCompleted: ["t1", "t2", "t3"]` should calculate:
- Progress for that record: `(3 / 5) * 100 = 60%`
- NOT `(3 / 10) * 100 = 30%`

### Frontend sends this payload on create:

```json
{
  "sStudentId": "uuid",
  "sTitle": "Completar rutina diaria",
  "sMeasurementType": "TAREAS",
  "tStartDate": "2026-03-25",
  "tTargetDate": "2026-06-25",
  "iTargetValue": 5,
  "aTasks": [
    { "sTitle": "Task 1", "iOrder": 1 },
    { "sTitle": "Task 2", "iOrder": 2 },
    ...
  ]
}
```

---

## ISSUE 3: Date Filters Not Working on Two Endpoints

**Priority:** HIGH — dates are ignored, all data comes back regardless of range
**Endpoints:** `GET /schools/analytics` and `GET /students/:sStudentId/report`

### What happens

Both endpoints accept `tStartDate` and `tEndDate` as query parameters, but the response data is the same regardless of what dates are sent. The filtering is not being applied.

**Note:** `GET /schools/analytics` no longer returns 500 (that was fixed). It just doesn't filter.

### GET /students/:sStudentId/report

```
GET /students/uuid/report?tStartDate=2026-03-01&tEndDate=2026-03-25
```

**What should be filtered by date:**

| Field | Filter by date? | Logic |
|-------|----------------|-------|
| `oSummary.iTotalGoals` | NO | All goals for student |
| `oSummary.iActiveGoals` | NO | Current active goals |
| `oSummary.dAverageProgress` | NO | Current AVG(dProgress) |
| `oSummary.iOverdueGoals` | NO | Current overdue count |
| `oSummary.iTotalRecords` | YES | COUNT records WHERE tRecordDate in range |
| `oSummary.iCompletedGoals` | YES | Goals with tCompletedDate in range |
| `oSummary.iNotAchievedGoals` | YES | Goals with tCompletedDate in range |
| `aGoals[].aRecords` | YES | Only records WHERE tRecordDate in range |

**Likely cause in backend code:**
```typescript
// Check that sStart and sEnd actually have values:
const sStart = req.query.tStartDate as string;
const sEnd = req.query.tEndDate as string;

// If tRecordDate is TIMESTAMP, cast to DATE:
.whereRaw('"tRecordDate"::date >= ?', [sStart])
.whereRaw('"tRecordDate"::date <= ?', [sEnd])
```

### GET /schools/analytics

```
GET /schools/analytics?tStartDate=2026-02-18&tEndDate=2026-03-25
```

**What should be filtered by date:**

| Field | Filter by date? |
|-------|----------------|
| `iTotalSchools`, `iActiveSchools`, `iInactiveSchools` | NO |
| `iTotalStudents`, `dAvgStudents`, `dAvgTeachers` | NO |
| `iGoalProgress` | NO |
| `aRecentSchools` | NO |
| `sStudentsTrend` | YES — % change current period vs previous |
| `sGoalsTrend` | YES — % change current period vs previous |
| `aChartLabels` | YES — month names within range |
| `aGoalsTotalByMonth` | YES — goals created per month in range |
| `aGoalsCompletedByMonth` | YES — goals completed per month (by tCompletedDate) |

---

## ISSUE 4: New Field `iTargetOpportunities` for OPORTUNIDAD Goals

**Priority:** HIGH — affects how OPORTUNIDAD goals are created, recorded, and displayed
**Endpoints affected:** `POST /goals`, `PUT /goals/:id`, `GET /goals/student/:id`, `GET /goals/:id`, `GET /students/:id/report`

### What changed

Previously, OPORTUNIDAD goals only had `iTargetValue` as a success percentage (e.g., 80%). Now the teacher defines a fraction: "goal is 8 successful out of 10 total attempts per session."

Two new concepts:
- **`iTargetOpportunities`** — fixed total attempts per session (the denominator, e.g., 10)
- **`iTargetValue`** — target number of successful attempts (the numerator, e.g., 8)

### What the backend must do

**1. New column on Goals table:**
```sql
ALTER TABLE "Goals" ADD COLUMN IF NOT EXISTS "iTargetOpportunities" INTEGER;
```

**2. Accept on `POST /goals` and `PUT /goals/:id`:**

The frontend sends this payload when creating an OPORTUNIDAD goal:
```json
{
  "sStudentId": "uuid",
  "sTitle": "Seguir instrucciones",
  "sMeasurementType": "OPORTUNIDAD",
  "tStartDate": "2026-03-25",
  "tTargetDate": "2026-06-25",
  "iTargetValue": 8,
  "iTargetOpportunities": 10
}
```

Both `iTargetValue` and `iTargetOpportunities` must be stored and returned.

**3. Return in ALL goal responses:**

These endpoints MUST return `iTargetOpportunities` in every OPORTUNIDAD goal object:
- `GET /goals/student/:sStudentId` — goal list
- `GET /goals/:sGoalId` — goal detail
- `GET /students/:sStudentId/report` — report goals

Example response:
```json
{
  "sGoalId": "uuid",
  "sMeasurementType": "OPORTUNIDAD",
  "iTargetValue": 8,
  "iTargetOpportunities": 10,
  "dProgress": 75.0,
  ...
}
```

**4. Records still send `iSuccessful` and `iOpportunities`:**

When creating a record (`POST /trackingRecords`), the frontend sends:
```json
{
  "sGoalId": "uuid",
  "dtDate": "2026-03-25",
  "sNotes": "Good session",
  "iSuccessful": 7,
  "iOpportunities": 10
}
```

`iOpportunities` will always match the goal's `iTargetOpportunities` (frontend enforces this). Backend should still store both per record.

**5. Display format:**

The frontend now shows OPORTUNIDAD progress as fractions everywhere:
- GoalCard: "7/10" (average successful / total)
- Target: "8/10" (iTargetValue / iTargetOpportunities)
- Records: "7/10 exitosos"

**6. Progress calculation (updated):**
```
Record percentage: (iSuccessful / iOpportunities) * 100
Goal progress: AVG of last 3 record percentages, then (avg / iTargetValue * iTargetOpportunities) * 100
```

---

## ISSUE 5: New Field `sDirection` for Goal Direction (INCREASE/DECREASE)

**Priority:** HIGH — affects progress calculation for 4 measurement types
**Endpoints affected:** `POST /goals`, `PUT /goals/:id`, `GET /goals/student/:id`, `GET /goals/:id`, `GET /students/:id/report`

### What changed

Goals of type FRECUENCIA, DURACION, OPORTUNIDAD, and EXACTITUD can now have a direction: INCREASE (default, current behavior) or DECREASE (new — "reduce this value").

FRECUENCIA was always hardcoded as a decrease goal. Now it explicitly uses `sDirection` and can also be INCREASE (e.g., "raise hand more often").

### New column on Goals table

```sql
ALTER TABLE "Goals" ADD COLUMN IF NOT EXISTS "sDirection" VARCHAR(10) DEFAULT 'INCREASE';
```

Valid values: `'INCREASE'` or `'DECREASE'`

### What the frontend sends on `POST /goals` and `PUT /goals/:id`

**DECREASE goal example (reduce duration from 30 to 10 min):**
```json
{
  "sStudentId": "uuid",
  "sTitle": "Reducir tiempo en tarea",
  "sMeasurementType": "DURACION",
  "sDirection": "DECREASE",
  "iBaselineValue": 30,
  "iTargetDuration": 10,
  "tStartDate": "2026-03-25",
  "tTargetDate": "2026-06-25"
}
```

**INCREASE goal example (current behavior, default):**
```json
{
  "sStudentId": "uuid",
  "sTitle": "Aumentar atención",
  "sMeasurementType": "DURACION",
  "sDirection": "INCREASE",
  "iTargetDuration": 15,
  "tStartDate": "2026-03-25",
  "tTargetDate": "2026-06-25"
}
```

**FRECUENCIA INCREASE (new — was always decrease before):**
```json
{
  "sStudentId": "uuid",
  "sTitle": "Levantar la mano más",
  "sMeasurementType": "FRECUENCIA",
  "sDirection": "INCREASE",
  "iTargetValue": 5,
  "tStartDate": "2026-03-25",
  "tTargetDate": "2026-06-25"
}
```

### Fields used per direction

| Field | INCREASE | DECREASE |
|-------|----------|----------|
| `sDirection` | `'INCREASE'` (or null/undefined = default) | `'DECREASE'` |
| `iBaselineValue` | Not used (except legacy FRECUENCIA) | Required — starting point |
| `iTargetValue` | Goal to reach (higher) | Goal to reach (lower than baseline) |

### What the backend must return in ALL goal responses

Every goal object must include `sDirection` (default `'INCREASE'` if null):

```json
{
  "sGoalId": "uuid",
  "sMeasurementType": "DURACION",
  "sDirection": "DECREASE",
  "iBaselineValue": 30,
  "iTargetDuration": 10,
  "dProgress": 75.0,
  ...
}
```

Affected endpoints:
- `GET /goals/student/:sStudentId` — goal list
- `GET /goals/:sGoalId` — goal detail
- `GET /students/:sStudentId/report` — report goals

### Progress calculation update

**INCREASE (no change, current behavior):**
```
EXACTITUD: (correct/total * 100) → average → (avg / iTargetValue) * 100
DURACION: (minutes / iTargetDuration) * 100
OPORTUNIDAD: (successful/total * 100)
FRECUENCIA INCREASE (new): (count / iTargetValue) * 100
```

**DECREASE (new formula for all types):**
```
((iBaselineValue - actualValue) / (iBaselineValue - iTargetValue)) * 100

Examples:
- FRECUENCIA DECREASE: ((10 - 5) / (10 - 3)) * 100 = 71.4%
- DURACION DECREASE: ((30 - 15) / (30 - 10)) * 100 = 75%
- EXACTITUD DECREASE: ((80 - 50) / (80 - 20)) * 100 = 50%
- OPORTUNIDAD DECREASE: ((80% - 50%) / (80% - 30%)) * 100 = 60%
```

Where `actualValue` is:
- FRECUENCIA: `iOccurrences` (raw count)
- DURACION: `iDurationMinutes`
- EXACTITUD: `(iHits / (iHits + iErrors)) * 100` (accuracy %)
- OPORTUNIDAD: `(iAchieved / iTotal) * 100` (success rate %)

### Backwards compatibility

- Goals without `sDirection` (null) → treat as `'INCREASE'`
- FRECUENCIA goals without `sDirection` → treat as `'DECREASE'` (legacy behavior)
- `iBaselineValue` already exists with default 10, used by FRECUENCIA — no migration needed for this column

---

## ISSUE 6: Goal Search — Include Description and Folio

**Priority:** MEDIUM — improves usability of goal search
**Endpoint:** `GET /goals/student/:sStudentId`

### What happens now

The frontend sends `sSearch` as a query parameter. The backend currently only searches in `sTitle`.

### What needs to change

The backend must also search in `sDescription` and in a computed folio code.

**The folio** is a 6-character code derived from the `sGoalId` using this hash function:

```javascript
function computeFolio(sGoalId) {
  let iHash = 0;
  for (let i = 0; i < sGoalId.length; i++) {
    iHash = ((iHash << 5) - iHash) + sGoalId.charCodeAt(i);
    iHash = iHash & iHash; // Convert to 32bit integer
  }
  const sCode = Math.abs(iHash).toString().padStart(6, '0').slice(-6);
  return 'MYV-' + sCode;
}
```

Example: `sGoalId = "d00ebf79-e5ef-42f4-a817-3fd55e9d0c4d"` → `MYV-XXXXXX`

### Implementation

```sql
-- Current query (only sTitle):
WHERE "sTitle" ILIKE '%search%'

-- Updated query (sTitle + sDescription + folio):
WHERE (
  "sTitle" ILIKE '%search%'
  OR "sDescription" ILIKE '%search%'
)
```

For the folio: since it's computed from `sGoalId`, the simplest approach is to check if the search term matches the pattern `MYV-XXXXXX`. If it does, compute the folio for each goal and filter. Alternatively, add a `sFolio` computed column or filter in application code after the SQL query.

**Frontend sends:**
```
GET /goals/student/:id?sSearch=MYV-123456&iPageNumber=1&iItemsPerPage=10
GET /goals/student/:id?sSearch=comprensión&iPageNumber=1&iItemsPerPage=10
```

Both should return matching goals.

---

## ISSUE 7: Student Fields — Change Birth Year to Birth Date + Add Gender

**Priority:** HIGH — affects IEP PDF student info section
**Endpoints affected:** `POST /students`, `PUT /students/:id`, `GET /students/:id`, `GET /students`

### Migration

```sql
-- Replace iBirthYear with tBirthDate
ALTER TABLE "Students" ADD COLUMN IF NOT EXISTS "tBirthDate" DATE;
-- Optionally migrate existing data: UPDATE "Students" SET "tBirthDate" = make_date("iBirthYear", 1, 1) WHERE "iBirthYear" IS NOT NULL;

-- Add gender
ALTER TABLE "Students" ADD COLUMN IF NOT EXISTS "sGender" VARCHAR(2) DEFAULT '';
```

Valid `sGender` values: `'M'` (Masculino), `'F'` (Femenino), `''` (not set)

### What the frontend sends on `POST /students` and `PUT /students/:id`

```json
{
  "sName": "René",
  "sLastName": "Martínez",
  "tBirthDate": "2018-05-15",
  "sGender": "M",
  "sGrade": "3ro Primaria",
  ...
}
```

**Note:** Frontend no longer sends `iBirthYear`. It sends `tBirthDate` as `YYYY-MM-DD` string.

### What the backend must return in all student responses

```json
{
  "sStudentId": "uuid",
  "sFullName": "René Martínez",
  "tBirthDate": "2018-05-15",
  "sGender": "M",
  "sGrade": "3ro Primaria",
  "sDiagnosis": "TDAH",
  "sCustomStudentId": "ALU-001",
  ...
}
```

Affected endpoints: `GET /students`, `GET /students/:id`, `POST /students`, `PUT /students/:id`

---

## ISSUE 8: IEP New Fields — Dates + Team Members

**Priority:** HIGH — affects IEP form and PDF generation
**Endpoints affected:** `POST /iep`, `GET /iep`

### Migration

```sql
-- IEP dates
ALTER TABLE "IEPs" ADD COLUMN IF NOT EXISTS "dtIepStartDate" DATE;
ALTER TABLE "IEPs" ADD COLUMN IF NOT EXISTS "dtIepReviewDate" DATE;

-- Notes
ALTER TABLE "IEPs" ADD COLUMN IF NOT EXISTS "sNotes" TEXT DEFAULT '';

-- Team members (JSONB array)
ALTER TABLE "IEPs" ADD COLUMN IF NOT EXISTS "aTeamMembers" JSONB DEFAULT '[]';
```

### `aTeamMembers` structure

```json
[
  {
    "sTeamMemberId": "tm-1234567890",
    "sName": "Lucia Potes",
    "sRole": "Maestra titular"
  },
  {
    "sTeamMemberId": "tm-1234567891",
    "sName": "Dr. García",
    "sRole": "Terapeuta de lenguaje"
  }
]
```

### What the frontend sends on `POST /iep`

These new fields are included in the IEP payload alongside existing fields:

```json
{
  "sStudentId": "uuid",
  "sStatus": "DRAFT",
  "dtIepStartDate": "2026-03-01",
  "dtIepReviewDate": "2026-09-01",
  "aTeamMembers": [
    { "sTeamMemberId": "tm-123", "sName": "Lucia", "sRole": "Directora" }
  ],
  "aExternalServices": [...],
  ...existing fields...
}
```

### What the backend must return on `GET /iep?sStudentId=xxx`

Include the new fields in the IEP response:

```json
{
  "message": "Success",
  "oData": {
    "sIepId": "uuid",
    "dtIepStartDate": "2026-03-01",
    "dtIepReviewDate": "2026-09-01",
    "aTeamMembers": [...],
    ...existing fields...
  },
  "success": true
}
```

---

## CHECKLIST

- [ ] ISSUE 1: Return `aTasksCompleted` in report records for TAREAS goals
- [ ] ISSUE 1: Return `aTasksCompleted` in `GET /goals/:id/trackingRecords`
- [ ] ISSUE 1: Accept & store `aTasksCompleted` in `POST /trackingRecords`
- [ ] ISSUE 2: Accept & return `iTargetValue` for TAREAS goals
- [ ] ISSUE 2: Update TAREAS progress calculation to use `iTargetValue`
- [ ] ISSUE 3: Fix date filtering on `GET /students/:id/report`
- [ ] ISSUE 3: Fix date filtering on `GET /schools/analytics`
- [ ] ISSUE 4: Add `iTargetOpportunities` column to Goals table
- [ ] ISSUE 4: Accept `iTargetOpportunities` on `POST /goals` and `PUT /goals/:id`
- [ ] ISSUE 4: Return `iTargetOpportunities` in all goal responses
- [ ] ISSUE 5: Add `sDirection` column to Goals table (default `'INCREASE'`)
- [ ] ISSUE 5: Accept `sDirection` on `POST /goals` and `PUT /goals/:id`
- [ ] ISSUE 5: Return `sDirection` in all goal responses
- [ ] ISSUE 5: Update progress calculation to use DECREASE formula when `sDirection = 'DECREASE'`
- [ ] ISSUE 5: FRECUENCIA without `sDirection` → treat as DECREASE (backwards compat)
- [ ] ISSUE 6: Goal search include `sDescription` and folio (`MYV-XXXXXX`)
- [ ] ISSUE 7: Add `tBirthDate` column to Students (replace `iBirthYear`)
- [ ] ISSUE 7: Add `sGender` column to Students
- [ ] ISSUE 7: Accept & return `tBirthDate` and `sGender` in all student endpoints
- [ ] ISSUE 8: Add `dtIepStartDate`, `dtIepReviewDate`, `aTeamMembers`, `sNotes` columns to IEPs
- [ ] ISSUE 8: Accept & return new IEP fields on `POST /iep` and `GET /iep`
- [ ] ISSUE 9: Add `POST /students/:id/image` endpoint for student photo upload
- [ ] ISSUE 9: Return `oImages` (with `sm` and `md` URLs) in all student responses
- [ ] ISSUE 10: Login response `oSchool.sSchoolLogo` must be a signed URL, not an S3 key
- [ ] ISSUE 11: Create `StudentAssignments` junction table
- [ ] ISSUE 11: `POST /students/:id/assignments` — assign teacher
- [ ] ISSUE 11: `DELETE /students/:id/assignments/:assignmentId` — unassign teacher
- [ ] ISSUE 11: `GET /students/:id/assignments` — list assigned teachers
- [ ] ISSUE 11: `GET /students` must filter by assignments for FACULTY users

---

## ISSUE 9: Student Photo Upload

**Priority:** MEDIUM — improves student identification
**Endpoints:** New `POST /students/:sStudentId/image`, affects `GET /students`, `GET /students/:id`

### New endpoint: `POST /students/:sStudentId/image`

**MUST follow the exact same pattern as `POST /schools/:sSchoolId/image`.**

Reference implementation: `schools.controllers.ts` → `uploadSchoolImage` (lines 182-225), `schools.routes.ts` (lines 55-63), `schools.validations.ts` (lines 49-52).

### Route setup

Add to students routes (same pattern as schools):

```typescript
// In students.routes.ts — add alongside existing student routes
router.post('/:sStudentId/image', /* multer middleware */, uploadStudentImage);
```

### Validation (same as schools)

```typescript
oImage: Joi.array().items().optional().allow(null).allow("").error(new Error("Students oImage")),
bDeleteImage: RequiredBoolean('Students bDeleteImage'),
```

### Controller (replicate `uploadSchoolImage`)

```typescript
async uploadStudentImage(req, res, next) {
  const { sStudentId } = req.params;

  // 1. Verify student exists and belongs to school
  // 2. If bDeleteImage === 'true': clear sImageKey on student, delete from S3
  // 3. If oImage file exists:
  //    - Upload via StorageServices.UploadManyImages(file, 'studentImages')
  //    - Update student: StudentQueries.updateStudentImage(sStudentId, sImageKey)
  // 4. Return updated student with oImages
}
```

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `oImage` | File | No | Image file via `req.files.oImage` (same as schools) |
| `bDeleteImage` | string | Yes | `'true'` to remove, `'false'` to upload |

### Database

```sql
ALTER TABLE "Students" ADD COLUMN IF NOT EXISTS "sImageKey" VARCHAR(255);
```

### S3 storage

Use `StorageServices.UploadManyImages(file, 'studentImages')` — same function as schools, just different S3 folder prefix (`studentImages/` instead of `schoolImages/`).

Creates 5 sizes: xs(90px), sm(150px), md(300px), lg(612px), xlg(1080px).

### Model hook — `$afterFind` on Students model

Same pattern as `Schools.model.ts` → `$afterFind()` (lines 75-84):

```typescript
async $afterFind() {
  if (this.sImageKey) {
    this.oImages = await StorageServices.GetManyImages(this.sImageKey, ['xs', 'sm', 'md', 'lg', 'xlg']);
  }
}
```

This automatically attaches `oImages` to every student query result.

### Response format

Every student object returned by any endpoint will include:

```json
{
  "sStudentId": "uuid",
  "sFullName": "René Martínez",
  "sImageKey": "studentImages/abc123def456",
  "oImages": {
    "xs": "https://bucket.s3.../studentImages/abc123-xs.jpg?signed...",
    "sm": "https://bucket.s3.../studentImages/abc123-sm.jpg?signed...",
    "md": "https://bucket.s3.../studentImages/abc123-md.jpg?signed...",
    "lg": "https://bucket.s3.../studentImages/abc123-lg.jpg?signed...",
    "xlg": "https://bucket.s3.../studentImages/abc123-xlg.jpg?signed..."
  },
  ...
}
```

If no photo uploaded: `oImages` will be `undefined`/absent. Frontend handles this with fallback to initials.

### Frontend usage (already implemented)

- **Student list:** `row.oImages?.sm` → small thumbnail in table
- **Student detail:** `oStudent.oImages?.md` → medium in avatar circle
- **Student form (create):** submits `oPhoto` File, parent page uploads via `POST /students/:id/image`
- **Student detail hover:** click avatar → file picker → `POST /students/:id/image` → refresh

---

## ISSUE 10: Login Response — `sSchoolLogo` Must Be a Signed URL

**Priority:** HIGH — school logo shows as broken image everywhere
**Endpoint:** `POST /auth/login`

### What happens now

The login response returns:
```json
{
  "results": {
    "oSchool": {
      "sSchoolId": "uuid",
      "sSchoolName": "Test School",
      "sSchoolLogo": "schoolImages/acd2c38b807c82da61c778a10b779252"
    }
  }
}
```

`sSchoolLogo` is the **raw S3 key**, not a usable URL. The frontend stores this in localStorage and tries to use it as an image `src` — it fails because it's not a URL.

### What it should return

```json
{
  "results": {
    "oSchool": {
      "sSchoolId": "uuid",
      "sSchoolName": "Test School",
      "sSchoolLogo": "https://bucket.s3.amazonaws.com/schoolImages/acd2c38b-md.jpg?X-Amz-Signature=..."
    }
  }
}
```

`sSchoolLogo` must be a **signed URL** (the `md` size) that the browser can load directly.

### How to fix

In the login controller, after getting the school data, call `StorageServices.GetManyImages(school.sImageKey)` and return the `md` URL as `sSchoolLogo`:

```typescript
const oSchool = await SchoolQueries.findSchoolById(user.sSchoolId);
let sSchoolLogo = '';
if (oSchool?.sImageKey) {
  const oImages = await StorageServices.GetManyImages(oSchool.sImageKey, ['md']);
  sSchoolLogo = oImages?.md || '';
}

// Include in response:
oSchool: {
  sSchoolId: oSchool.sSchoolId,
  sSchoolName: oSchool.sName,
  sSchoolLogo: sSchoolLogo,  // signed URL, not raw key
}
```

### Note on expiry

Signed URLs expire (currently 7 days / 604800 seconds). Since the frontend stores this in localStorage and the user might stay logged in longer than 7 days, the logo URL could expire. This is acceptable for now — the frontend handles missing/broken images gracefully with fallbacks.

---

## ISSUE 11: Student-Teacher Assignments (Access Control)

**Priority:** HIGH — controls which students a teacher (FACULTY) can see
**Pattern:** Same as SHIPO's `ShipmentDispatchers` junction table

### Business rules

- Users with `sType: 'ADMINISTRATION'` (SchoolAdmin) see ALL students — no filtering
- Users with `sType: 'FACULTY'` (Teacher) see ONLY students they are assigned to
- If a FACULTY user has no assignments, they see an empty student list
- Assignments are managed by ADMINISTRATION users only

### New junction table

```sql
CREATE TABLE "StudentAssignments" (
  "sStudentAssignmentId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sStudentId" UUID NOT NULL REFERENCES "Students"("sStudentId"),
  "sSchoolUserId" UUID NOT NULL REFERENCES "SchoolUsers"("sSchoolUserId"),
  "created_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("sStudentId", "sSchoolUserId")
);

CREATE INDEX "StudentAssignments_sStudentId_idx" ON "StudentAssignments"("sStudentId");
CREATE INDEX "StudentAssignments_sSchoolUserId_idx" ON "StudentAssignments"("sSchoolUserId");
```

### New endpoints

**1. `POST /students/:sStudentId/assignments` — Assign teacher**

```json
// Request
{ "sSchoolUserId": "teacher-uuid" }

// Response (201)
{
  "message": "Docente asignado exitosamente.",
  "oData": {
    "sStudentAssignmentId": "uuid",
    "sStudentId": "student-uuid",
    "sSchoolUserId": "teacher-uuid"
  },
  "success": true
}
```

**2. `DELETE /students/:sStudentId/assignments/:sStudentAssignmentId` — Unassign teacher**

```json
// Response (200)
{
  "message": "Docente desasignado exitosamente.",
  "success": true
}
```

**3. `GET /students/:sStudentId/assignments` — List assigned teachers**

Returns the assigned teachers with their info:

```json
{
  "aData": [
    {
      "sStudentAssignmentId": "uuid",
      "sStudentId": "student-uuid",
      "sSchoolUserId": "teacher-uuid",
      "sFullName": "María García López",
      "sName": "María",
      "sLastName": "García",
      "sEmail": "maria@school.com"
    }
  ],
  "success": true
}
```

Join with SchoolUsers to return teacher name/email.

### Modify `GET /students` — Filter for FACULTY users

```typescript
// In students controller:
const { sSchoolId, sSchoolUserId, sUserType } = res.locals;

let query = StudentsModel.query()
  .where('sSchoolId', sSchoolId)
  .where('bActive', true);

// FACULTY users: only see assigned students
if (sUserType === 'FACULTY') {
  const aAssignedStudentIds = await StudentAssignmentsModel.query()
    .where('sSchoolUserId', sSchoolUserId)
    .select('sStudentId');

  query = query.whereIn('sStudentId', aAssignedStudentIds.map(a => a.sStudentId));
}
```

### Frontend already implements

- "Asignar docentes" button on student detail (only for SchoolAdmin)
- Dialog with search + assign/unassign (same pattern as SHIPO responsibles)
- Add/Edit/Delete student buttons hidden for non-SchoolAdmin users
- IEP Team Members auto-populates from assigned teachers

---

*Generated: March 25, 2026*
