# MY VILLAGE — Backend Issues Report (March 18, 2026)

**Purpose:** Confirmed backend issues found during frontend integration testing. Only includes verified failures, not speculation.

**Environment:** `http://ec2-34-234-88-242.compute-1.amazonaws.com/development/api/v1/sp`

---

## ISSUE 1: GET /schools/analytics — 500 Internal Server Error

**Priority:** CRITICAL
**Status:** CONFIRMED — tested live on March 18, 2026

**Exact request that fails:**
```
curl 'http://ec2-34-234-88-242.compute-1.amazonaws.com/development/api/v1/sp/schools/analytics?tStartDate=2026-03-01&tEndDate=2026-03-18' \
  -H 'Authorization: Bearer {valid SuperAdmin token}' \
  -H 'Accept: application/json'
```

**Response:** HTTP 500 Internal Server Error

**Impact:** The entire SuperAdmin dashboard (`/admin/dashboard`) is broken. No metrics, no chart, no recent schools list.

**Frontend code calling this:**
File: `app/pages/admin/dashboard.vue`, line 323:
```javascript
$api.get('/schools/analytics', { params: { tStartDate: '2026-03-01', tEndDate: '2026-03-18' }, silent: true })
```

**Backend code involved:**
File: `src/Api/022_Schools/schools.controllers.ts`, line 229-241 — `getSchoolsAnalytics()`
File: `src/Api/022_Schools/schools.queries.ts`, line 280-478 — `findSchoolsAnalytics()`

The method runs 8 parallel raw SQL queries using `Promise.all()`. One or more of them is crashing. The queries reference these columns on the `Goals` table:
- `"Goals"."dProgress"` (queries #3 and #7)
- `"Goals"."tCompletedDate"` (queries #7 and #8)
- `"Goals"."sStatus"` (queries #3, #7, #8)

**How to debug:**
1. Check server logs for the actual SQL error
2. Verify all referenced columns exist:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'Goals' ORDER BY ordinal_position;
```
3. If any column is missing, add it via migration

**What the frontend expects in a successful response:**
```json
{
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
  "aChartLabels": ["Ene", "Feb", "Mar"],
  "aGoalsTotalByMonth": [12, 18, 25],
  "aGoalsCompletedByMonth": [5, 8, 12],
  "aRecentSchools": [
    {
      "sSchoolId": "uuid",
      "sName": "Colegio",
      "bBlocked": false,
      "dtCreatedAt": "2026-01-15T...",
      "iStudents": 45,
      "iTeachers": 5
    }
  ],
  "success": true
}
```

---

## ISSUE 2: S3 Image URLs Not Loading

**Priority:** MEDIUM
**Status:** CONFIRMED — school logos show fallback icons instead of actual images

**Affected endpoints:**
- `GET /schools` — `oImages.sm` per school
- `GET /schools/:id` — `oImages.md` in detail
- `POST /auth/login` — `oSchool.sSchoolLogo` and `oSchool.oImages`

**Frontend reads:**
```javascript
// School list (line 79-80 of schools/index.vue)
row.oImages?.sm

// School detail (line 17-21 of schools/[id]/index.vue)
oSchool.oImages?.md
```

**Problem:** The URLs returned in `oImages` are not accessible from the browser. Either CORS headers are missing, the S3 bucket policy doesn't allow public reads, or pre-signed URLs have expired.

---

## ISSUE 3: File Upload Returns "Formato de documento no soportado" (S3 Config Issue)

**Priority:** HIGH
**Status:** CONFIRMED — tested uploading a PDF to goal files

**Request:**
```
POST /goals/{sGoalId}/goalFiles
Content-Type: multipart/form-data
Body:
  oFile: [PDF file, Content-Type: application/pdf]
  sArrGoalFileNames: "dummy.pdf"
```

**Response:** 400 `"Formato de documento no soportado."`

**Root Cause (from code analysis):**
The error message is misleading. PDF IS a supported format (`CheckFormat` in `Storage.services.ts` line 204 explicitly handles `application/pdf`). The actual error comes from `s3.upload().catch()` at line 196-198 which throws `invalidFile` for ANY S3 upload failure:

```typescript
.catch(err => {
    console.log(err)
    throw new MyError(400, ErrorMessages.UploadImages.invalidFile[sLang]);
});
```

The real issue is likely:
1. Missing or invalid AWS credentials (`AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. S3 bucket doesn't exist or is in wrong region
3. IAM permissions don't allow `s3:PutObject`

**How to fix:**
1. Check backend server logs — the `console.log(err)` on line 197 will show the real S3 error
2. Verify AWS env vars are set in the deployment
3. Fix the error message to show the actual S3 error instead of "formato no soportado"

**This affects ALL file uploads in the app:**

1. `POST /goals/{sGoalId}/goalFiles` — Goal document upload
2. `POST /trackingRecords/{sTrackingRecordId}/files` — Record file upload
3. `POST /schools/{sSchoolId}/image` — School logo upload

**Confirmed failing request (record files):**
```bash
curl 'http://ec2-34-234-88-242.compute-1.amazonaws.com/development/api/v1/sp/trackingRecords/e8a10ddf-36d1-412d-82cf-990b9275d7e6/files' \
  -X POST \
  -H 'Authorization: Bearer {valid token}' \
  -F 'oFile=@NeoBrik-logo-color-2.png;type=image/png' \
  -F 'sArrFileNames=NeoBrik-logo-color-2.png'
```
Response: 400 `"Formato de documento no soportado."`

Both PNG (`image/png`) and PDF (`application/pdf`) are in the `CheckFormat` whitelist — the error is from S3, not format validation.

---

## ISSUE 4: PUT /schoolUsers/:id — sType Change Is Ignored

**Priority:** MEDIUM
**Status:** CONFIRMED — from code analysis

**Problem:** The frontend sends `sType` in the update payload (e.g., changing from `FACULTY` to `ADMINISTRATION`). The backend validation accepts it (`UpdateSchoolUserBody` in `schoolUsers.validations.ts` line 30), but the query in `schoolUsers.queries.ts` line 136 does NOT include `sType` in the patch:

```typescript
// Current (line 136):
static async updateSchoolUser(sSchoolUserId, { sName, sLastName, sSecondLastName, bActive, sLastUpdatedBy }) {
```

**Fix:** Add `sType` to the destructured params and to `patchData`:
```typescript
static async updateSchoolUser(sSchoolUserId, { sName, sLastName, sSecondLastName, sType, bActive, sLastUpdatedBy }) {
    const patchData: any = { sName, sLastName, sSecondLastName, sLastUpdatedBy };
    if (sType) patchData.sType = sType;
```

**Note:** `sType` is stored in the `Users` table (not `SchoolUsers`), so the `patchAndFetchById` on `UsersModel` should handle it if the column exists there. Verify that `Users` table has a `sType` column, or if `sType` is derived from `sCreatedBy` (NULL = ADMINISTRATION, NOT NULL = FACULTY). If derived, then `sType` updates need a different approach.

---

## ISSUE 5: DELETE /trackingRecords/:id — Returns "sLang is not allowed"

**Priority:** HIGH
**Status:** CONFIRMED — tested live

**Exact request:**
```bash
curl 'http://ec2-34-234-88-242.compute-1.amazonaws.com/development/api/v1/sp/trackingRecords/e6156424-6b60-4a80-9543-4693584d7620' \
  -X 'DELETE' \
  -H 'Authorization: Bearer {valid token}'
```

**Response:** 409 `{"code":409,"status":false,"name":"CustomError","message":"\"sLang\" is not allowed"}`

**Root cause (from code):**
File: `trackingRecords.routes.ts` line 29-30:
```typescript
router.delete('/:sTrackingRecordId',
    celebrate({ params: TrackingRecordValidations.DeleteTrackingRecordParams }),
```

The router uses `mergeParams: true` (line 9), so Express merges parent route params into `req.params`. The full URL is `/:sLang/trackingRecords/:sTrackingRecordId`, which means `req.params = { sLang: 'sp', sTrackingRecordId: '...' }`.

`DeleteTrackingRecordParams` only allows `sTrackingRecordId`, so Celebrate rejects `sLang`.

**Fix:** Add `sLang` to the params validation:
```typescript
export const DeleteTrackingRecordParams = Validations.JoiObjectKeys({
    sTrackingRecordId: Validations.RequiredUUID("TrackingRecords sTrackingRecordId"),
    sLang: Joi.string().required(),
});
```

Or use `allowUnknown: true` in the celebrate options for params:
```typescript
celebrate({ params: TrackingRecordValidations.DeleteTrackingRecordParams.options({ allowUnknown: true }) })
```

**CONFIRMED: This affects ALL tracking record routes that validate params with `mergeParams: true`:**
- `DELETE /trackingRecords/:id` — CONFIRMED 409 sLang
- `PATCH /trackingRecords/:id/toggleExclusion` — CONFIRMED 409 sLang
- `GET /trackingRecords/:id/files` — likely affected too
- `DELETE /trackingRecords/:id/files/:fileId` — likely affected too

---

## ISSUE 6: GET /profile — Endpoint Does Not Exist

**Priority:** MEDIUM
**Status:** CONFIRMED — no GET route in `profile.routes.ts`

**Problem:** There's no `GET /profile` endpoint. After updating the profile with PUT, the frontend has no way to re-fetch the latest data from the server. Currently the frontend updates localStorage locally, but on re-login the data comes from the login response which may not include the updated phone.

**What backend needs to add:**
```typescript
router.get('/',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(ProfileController.getProfile)
);
```

Controller should return:
```json
{
  "message": "Success",
  "oData": {
    "sName": "School Admin Test",
    "sEmail": "admin@school.com",
    "sPhone": "+52 8110059811"
  },
  "success": true
}
```

**Also verify:** The login response includes `sPhone` mapped from the `sPhoneNumber` column in the Users table — if not, the phone will be lost on re-login even if it was saved correctly by PUT /profile.

---

## ISSUE 7: GET /students/:id/report — Date Filter Not Working Correctly

**Priority:** HIGH
**Status:** CONFIRMED — tested live

**Problem:** Changing the date range in the report endpoint does not properly filter the records. The same data is returned regardless of the date range sent.

**Examples tested:**
- No dates (default month): `iTotalRecords: 8`
- `tStartDate=2026-03-01&tEndDate=2026-03-31`: `iTotalRecords: 15` — same goals, same records
- `tStartDate=2026-01-01&tEndDate=2026-12-31`: `iTotalRecords: 15` — identical response

The `oSummary` also doesn't change between requests — `dAverageProgress` stays at `64.5` regardless of date range.

**Backend code involved:**
File: `students.controllers.ts` lines 177-185:
```typescript
allRecords = await TrackingRecordsModel.query()
    .whereIn('sGoalId', aGoalIds)
    .where('bActive', true)
    .whereNull('tDeletedAt')
    .modify(function(qb: any) {
        if (sStart) qb.where('tRecordDate', '>=', sStart);
        if (sEnd) qb.where('tRecordDate', '<=', sEnd);
    })
```

**Possible causes:**
1. `tRecordDate` column type might not match the comparison (timestamp vs date string)
2. The `oSummary` is computed from `aGoals` (all goals) not from filtered records
3. The date params might not be reaching the query correctly

---

## ISSUE 8: POST /iep — Returns 400 "Verifique que los campos ingresados sean correctos"

**Priority:** HIGH
**Status:** CONFIRMED — tested live with valid payload

**Exact request:**
```bash
curl 'http://ec2-34-234-88-242.compute-1.amazonaws.com/development/api/v1/sp/iep' \
  -X POST \
  -H 'Authorization: Bearer {valid token}' \
  -H 'Content-Type: application/json' \
  --data-raw '{"sStudentId":"6af31d85-...","sStatus":"DRAFT","aExternalServices":[...],...}'
```

**Response:** 400 `"Verifique que los campos ingresados sean correctos."`

**Analysis:** The validation passes (all fields match `UpsertIepBody`). The controller destructures and calls `IepQueries.upsertIep()` which does an INSERT. The error is likely a database-level issue:
1. The `Ieps` table might not exist or might be missing columns
2. JSONB columns (`aExternalServices`, `aModifications`, `aObjectives`, etc.) might not be properly typed
3. Check server logs for the actual SQL/Objection error

**Exact payload the frontend sends:**
```json
{
  "sStudentId": "uuid",
  "sStatus": "DRAFT",
  "aExternalServices": [
    {
      "sServiceId": "svc-1773892448894",
      "sServiceType": "Terapia del lenguaje",
      "sProfessional": "nombre del profesional",
      "sFrequency": "2 veces por semana"
    }
  ],
  "sParentNames": "Maria Garcia y Jose Lopez",
  "sParentConcerns": "Los padres consideran que aprende lento",
  "sSchoolAssignment": "GENERAL_ACCOMMODATIONS",
  "sSchoolAssignmentOther": "",
  "sStrengths": "Es un alumno visual",
  "sAreasOfOpportunity": "No tiene buena atencion sostenida",
  "sCognitiveEvaluations": "Comprension verbal 94",
  "sSubjectGrades": "Ciencias 8.0",
  "sEvaluationResults": "PROLEC-R bajo nivel",
  "sCommunicationComments": "Es bueno escuchando",
  "sMotorComments": "Es bueno construyendo cosas",
  "sSocioemotionalComments": "No es bueno hablando con companeros",
  "sIndependenceComments": "Es muy independiente",
  "aFocusAreas": ["ACADEMIC", "MOTOR", "ADAPTIVE", "COGNITIVE"],
  "sFocusAreasSubjects": "matematicas",
  "aAccommodations": ["PRESELECTED_SEAT", "SENSORY_BREAKS", "PENCIL_GRIP"],
  "sOtherAccommodations": "sin acomodaciones adicionales",
  "bRequiresModifications": true,
  "aModifications": [
    {
      "sModificationId": "mod-1773892500663",
      "dtDate": "2026-03-24",
      "sAreaModified": "mate",
      "sChangeType": "reduccion",
      "sReason": "muchos cambios",
      "sResponsible": "responsable",
      "sComments": "sin comentarios"
    }
  ],
  "aObjectives": [
    {
      "sObjectiveId": "obj-1773892515544",
      "sSubjectArea": "lectura",
      "sCurrentPerformance": "buen nivel",
      "sShortTermObjective": "mejorar comprension",
      "sProgressGraphLink": "",
      "sProgressLevel": "PARTIAL",
      "sProgressSummary": "sin resumen"
    }
  ]
}
```

**Column types expected in IEPs table:**
- `sIepId` UUID PK (auto-generated)
- `sStudentId` UUID FK → Students
- `sStatus` VARCHAR — 'DRAFT', 'ACTIVE', 'ARCHIVED'
- `aExternalServices` JSONB
- `sParentNames` TEXT
- `sParentConcerns` TEXT
- `sSchoolAssignment` VARCHAR
- `sSchoolAssignmentOther` TEXT
- `sStrengths` TEXT
- `sAreasOfOpportunity` TEXT
- `sCognitiveEvaluations` TEXT
- `sSubjectGrades` TEXT
- `sEvaluationResults` TEXT
- `sCommunicationComments` TEXT
- `sMotorComments` TEXT
- `sSocioemotionalComments` TEXT
- `sIndependenceComments` TEXT
- `aFocusAreas` JSONB (array of strings)
- `sFocusAreasSubjects` TEXT
- `aAccommodations` JSONB (array of strings)
- `sOtherAccommodations` TEXT
- `bRequiresModifications` BOOLEAN
- `aModifications` JSONB (array of objects)
- `aObjectives` JSONB (array of objects)
- `sCreatedBy` UUID
- `sLastUpdatedBy` UUID
- `bActive` BOOLEAN DEFAULT true
- `tDeletedAt` TIMESTAMP NULL
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Frontend sends correct payload** — validated against `ieps.validations.ts`. The issue is in the database layer (likely missing table or columns).

---

## ISSUE 9: Students Table — Add sCustomStudentId Column (REQUIRED)

**Priority:** MEDIUM
**Status:** NEW — frontend ready, backend needs 3 changes

**Context:** The IEP PDF shows the student's database UUID as "Id del estudiante", which is not user-friendly. The frontend now sends and displays a `sCustomStudentId` field — the school's internal student ID (e.g., "ALU-001", "2026-0034").

**What backend needs (3 changes):**

**1. Database migration — add column:**
```sql
ALTER TABLE "Students" ADD COLUMN IF NOT EXISTS "sCustomStudentId" VARCHAR(50) DEFAULT '';
```

**2. Validation — accept field in create and update (`students.validations.ts`):**

Add this line to BOTH `CreateStudentBody` and `UpdateStudentBody`:
```typescript
sCustomStudentId: Validations.String("Students sCustomStudentId"),
```

So they become:
```typescript
export const CreateStudentBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    sCustomStudentId: Validations.RequiredString("Students sCustomStudentId"),  // NEW — REQUIRED
    iBirthYear: Validations.RequiredPositiveInteger("Students iBirthYear"),
    sGrade: Validations.RequiredString("Students sGrade"),
    sGroup: Validations.String("Students sGroup"),
    sDiagnosis: Validations.String("Students sDiagnosis"),
    sNotes: Validations.String("Students sNotes"),
});

export const UpdateStudentBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    sCustomStudentId: Validations.RequiredString("Students sCustomStudentId"),  // NEW — REQUIRED
    iBirthYear: Validations.RequiredPositiveInteger("Students iBirthYear"),
    sGrade: Validations.RequiredString("Students sGrade"),
    sGroup: Validations.String("Students sGroup"),
    sDiagnosis: Validations.String("Students sDiagnosis"),
    sNotes: Validations.String("Students sNotes"),
});
```

**3. Query — include in insert/update (`students.queries.ts`):**

Add `sCustomStudentId` to the `insertStudent` and `updateStudent` methods:
```typescript
// insertStudent — add to the insert object:
sCustomStudentId,

// updateStudent — add to patchAndFetchById:
sCustomStudentId,
```

No changes needed for `findAllStudents` or `findOneStudent` — they use `SELECT Students.*` which will include the new column automatically.

**Frontend payload (create and edit):**
```json
{
  "sName": "Carlos",
  "sLastName": "Martinez",
  "sSecondLastName": "Lopez",
  "sCustomStudentId": "ALU-2026-001",
  "iBirthYear": 2015,
  "sGrade": "3° Primaria",
  "sGroup": "A",
  "sDiagnosis": "TDAH",
  "sNotes": ""
}
```

**Where it's used in frontend:**
- StudentForm (create/edit) — input field
- StudentDetail — displayed as "ID del alumno"
- IEP PDF export — "Id del estudiante" field

---

*Generated: March 18, 2026*
