# MY VILLAGE — Backend Feedback (April 2, 2026)

**Purpose:** Specific issues found during client testing that require backend fixes. Each item includes exact file locations, current behavior, expected behavior, and the fix needed.

---

## FIX 1: `iTargetDuration` and `iDurationMinutes` Must Accept Decimals

**Priority:** HIGH — blocks creating/recording duration goals with seconds precision
**Status:** Bug confirmed in backend code

### Problem

When a teacher creates a duration goal or records duration in seconds only (e.g., 30 seconds = 0.5 minutes), the backend rejects it because both fields validate as **integers only**.

The frontend sends `iTargetDuration: 0.5` (30 seconds) or `iDurationMinutes: 0.25` (15 seconds). The backend returns a validation error.

### Root cause

**File:** `/src/Middlewares/Validations.mw.ts` (line 159-161)
```typescript
export function PositiveInteger(error: string): typeof Joi {
    return Joi.number().allow(null).integer().min(0).error(new Error(error));
}
```

The `.integer()` constraint rejects decimal values.

**Used in:**

1. `/src/Api/024_Goals/goals.validations.ts` (line 12):
```typescript
iTargetDuration: Validations.PositiveInteger("Goals iTargetDuration"),
```

2. `/src/Api/024_Goals/goals.validations.ts` (line 46):
```typescript
iTargetDuration: Validations.PositiveInteger("Goals iTargetDuration"),
```

3. `/src/Api/024_Goals/003_TrackingRecords/trackingRecords.validations.ts` (line 16):
```typescript
iDurationMinutes: Validations.PositiveInteger("TrackingRecords iDurationMinutes"),
```

### Fix needed

Change the validation for these two specific fields from `PositiveInteger` to a new `PositiveNumber` validation (or use inline Joi):

**Option A — Create new validation helper:**
```typescript
// In Validations.mw.ts
export function PositiveNumber(error: string): typeof Joi {
    return Joi.number().allow(null).min(0).error(new Error(error));
}
```

**Option B — Change inline:**
```typescript
// In goals.validations.ts (both create and update)
iTargetDuration: Joi.number().allow(null).min(0).error(new Error("Goals iTargetDuration")),

// In trackingRecords.validations.ts
iDurationMinutes: Joi.number().allow(null).min(0).error(new Error("TrackingRecords iDurationMinutes")),
```

### What the frontend sends

**Creating a goal (30 seconds = 0.5 min):**
```json
POST /goals
{
  "sTitle": "Atención sostenida",
  "sMeasurementType": "DURACION",
  "iTargetDuration": 0.5,
  ...
}
```

**Recording progress (45 seconds = 0.75 min):**
```json
POST /trackingRecords
{
  "sGoalId": "uuid",
  "iDurationMinutes": 0.75,
  ...
}
```

### Database column type

Verify that the columns are `DECIMAL` or `FLOAT`, not `INTEGER`:

```sql
-- Check current type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'Goals' AND column_name = 'iTargetDuration';

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'TrackingRecords' AND column_name = 'iDurationMinutes';

-- If integer, change to decimal:
ALTER TABLE "Goals" ALTER COLUMN "iTargetDuration" TYPE DECIMAL;
ALTER TABLE "TrackingRecords" ALTER COLUMN "iDurationMinutes" TYPE DECIMAL;
```

### Progress recalculation

The progress calculation in `trackingRecords.queries.ts` (line 261-262) already handles decimals:
```typescript
pct = (record.iDurationMinutes / targetDuration) * 100;
```
No change needed there — just the validation and column types.

---

---

## FIX 2: Create Admin Accounts for Client

**Priority:** HIGH — client needs access
**Status:** Pending

### What's needed

Create two SchoolAdmin user accounts for the client's school:

1. **Email:** `lucypotes@myvillage.com.mx`
2. **Email:** `info@myvillage.com.mx`

Both should be:
- `sType`: SchoolAdmin (or equivalent admin role that has full access)
- Associated to the client's school
- With a temporary password and invitation to set their own password

This may be done via:
- Direct database insert
- The existing `POST /schoolUsers` endpoint
- An admin panel or script

Whatever method is used, ensure both accounts can log in and have full admin permissions (DELETE level on all modules: Students, Goals, Users, Reports).

---

## FIX 3: Goal Search — Include `sDescription` and Folio

**Priority:** MEDIUM — improves usability
**Endpoint:** `GET /goals/student/:sStudentId`

### Current behavior

The `sSearch` query parameter only searches in `sTitle`.

### Expected behavior

Search should also match against `sDescription` and the computed folio code (`MYV-XXXXXX`).

### SQL change

```sql
-- Current:
WHERE "sTitle" ILIKE '%search%'

-- Expected:
WHERE (
  "sTitle" ILIKE '%search%'
  OR "sDescription" ILIKE '%search%'
)
```

### Folio computation

The folio is a 6-character code derived from `sGoalId` using this hash function:

```javascript
function computeFolio(sGoalId) {
  let iHash = 0;
  for (let i = 0; i < sGoalId.length; i++) {
    iHash = ((iHash << 5) - iHash) + sGoalId.charCodeAt(i);
    iHash = iHash & iHash;
  }
  return 'MYV-' + Math.abs(iHash).toString().padStart(6, '0').slice(-6);
}
```

For folio search: if `sSearch` starts with `MYV-`, compute the folio for each goal in the query result and filter in application code. Or add a `sFolio` computed column.

### Frontend sends

```
GET /goals/student/:id?sSearch=comprensión&iPageNumber=1&iItemsPerPage=10
GET /goals/student/:id?sSearch=MYV-123456&iPageNumber=1&iItemsPerPage=10
```

---

## CHECKLIST

- [ ] FIX 1: `iTargetDuration` validation — allow decimals (goals.validations.ts lines 12, 46)
- [ ] FIX 1: `iDurationMinutes` validation — allow decimals (trackingRecords.validations.ts line 16)
- [ ] FIX 1: Verify DB columns are DECIMAL not INTEGER
- [ ] FIX 2: Create admin account `lucypotes@myvillage.com.mx`
- [ ] FIX 2: Create admin account `info@myvillage.com.mx`
- [ ] FIX 3: `GET /goals/student/:id` — search in `sDescription` + folio alongside `sTitle`
- [ ] FIX 4: `GET /students` — populate `oImages` from `sImageKey` (same as schools `$afterFind`)
- [ ] FIX 4: `GET /students/:id` — populate `oImages` from `sImageKey`
- [ ] FIX 4: `POST /students/:id/image` — store `sImageKey` on student after upload
- [ ] FIX 5: Verify `POST /students/:id/assignments` works (assign teacher to student)
- [ ] FIX 5: Verify `DELETE /students/:id/assignments/:id` works (unassign)
- [ ] FIX 5: Verify `GET /students/:id/assignments` returns assigned teachers
- [ ] FIX 5: `GET /students` must filter by assignments for FACULTY users

---

## FIX 4: Student Photos — `oImages` Not Populated After Upload

**Priority:** HIGH — student photos show as null even after successful upload
**Endpoints:** `GET /students`, `GET /students/:id`, `POST /students/:id/image`

### Problem

1. `POST /students/:id/image` returns 200 (upload succeeds)
2. But `GET /students` and `GET /students/:id` return `oImages: null` and `sImageKey: ""`
3. The upload either doesn't save `sImageKey` to the student record, or the `$afterFind` hook doesn't convert `sImageKey` to `oImages`

### Current response (WRONG)

```json
{
  "sStudentId": "8077b4be-...",
  "sImageKey": "",
  "oImages": null
}
```

### Expected response (CORRECT)

```json
{
  "sStudentId": "8077b4be-...",
  "sImageKey": "studentImages/abc123def456",
  "oImages": {
    "xs": "https://bucket.s3.../studentImages/abc123-xs.jpg?signed...",
    "sm": "https://bucket.s3.../studentImages/abc123-sm.jpg?signed...",
    "md": "https://bucket.s3.../studentImages/abc123-md.jpg?signed...",
    "lg": "https://bucket.s3.../studentImages/abc123-lg.jpg?signed...",
    "xlg": "https://bucket.s3.../studentImages/abc123-xlg.jpg?signed..."
  }
}
```

### Two things to check/fix

**1. `POST /students/:id/image` — save sImageKey**

After uploading the image to S3 via `StorageServices.UploadManyImages()`, the returned key must be saved to the student's `sImageKey` column. Same pattern as `SchoolQueries.updateSchoolImage()`:

```typescript
// In the student image upload controller:
const sImageKey = await StorageServices.UploadManyImages(file, 'studentImages');
await StudentsModel.query()
  .findById(sStudentId)
  .patch({ sImageKey });
```

**2. Students model — add `$afterFind` hook**

Same pattern as `Schools.model.ts` (lines 75-84). Add to the Students model:

```typescript
// In students.model.ts
async $afterFind() {
  if (this.sImageKey) {
    this.oImages = await StorageServices.GetManyImages(
      this.sImageKey, 
      ['xs', 'sm', 'md', 'lg', 'xlg']
    );
  }
}
```

This hook runs automatically on every `GET /students` and `GET /students/:id` query, converting the raw S3 key into signed URLs.

### Reference implementation

The schools module already does this correctly:

- **Upload:** `schools.controllers.ts` → `uploadSchoolImage()` (lines 182-225)
- **Model hook:** `schools.model.ts` → `$afterFind()` (lines 75-84)
- **Storage:** `StorageServices.UploadManyImages()` and `StorageServices.GetManyImages()`

Replicate the exact same pattern for students.

### Frontend usage

- **Student list:** `row.oImages?.sm` — thumbnail in table row
- **Student detail:** `oStudent.oImages?.md` — avatar circle with hover to change
- **Student form edit:** pre-loads existing photo from `oImages?.md`

---

## FIX 5: Student-Teacher Assignments — Verify & Filter

**Priority:** HIGH — controls which students a teacher can see
**Endpoints:** `POST /students/:id/assignments`, `DELETE /students/:id/assignments/:id`, `GET /students/:id/assignments`, `GET /students`

### What the frontend sends/expects

Full details are in `BACKEND_TODO_25MAR2026.md` → ISSUE 11. Summary:

**1. Assign teacher:**
```
POST /students/:sStudentId/assignments
Body: { "sSchoolUserId": "teacher-uuid" }
→ 201 { "message": "...", "oData": { "sStudentAssignmentId": "uuid", ... }, "success": true }
```

**2. Unassign teacher:**
```
DELETE /students/:sStudentId/assignments/:sStudentAssignmentId
→ 200 { "message": "...", "success": true }
```

**3. List assigned teachers:**
```
GET /students/:sStudentId/assignments
→ 200 { "aData": [{ "sStudentAssignmentId": "uuid", "sSchoolUserId": "uuid", "sFullName": "...", "sEmail": "..." }], "success": true }
```

Must join with SchoolUsers to return `sFullName` and `sEmail`.

**4. Filter students for FACULTY users:**

When a user with `sType: 'FACULTY'` calls `GET /students`, they should ONLY see students assigned to them. If no assignments, return empty list.

```typescript
// In students controller/query:
if (sUserType === 'FACULTY') {
  const aAssignedIds = await StudentAssignmentsModel.query()
    .where('sSchoolUserId', sSchoolUserId)
    .select('sStudentId');
  query = query.whereIn('sStudentId', aAssignedIds.map(a => a.sStudentId));
}
```

Users with `sType: 'ADMINISTRATION'` see ALL students (no filtering).

### Junction table (if not created yet)

```sql
CREATE TABLE IF NOT EXISTS "StudentAssignments" (
  "sStudentAssignmentId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sStudentId" UUID NOT NULL REFERENCES "Students"("sStudentId"),
  "sSchoolUserId" UUID NOT NULL REFERENCES "SchoolUsers"("sSchoolUserId"),
  "created_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("sStudentId", "sSchoolUserId")
);
```

---

*Generated: April 2, 2026*

*Generated: April 2, 2026*
