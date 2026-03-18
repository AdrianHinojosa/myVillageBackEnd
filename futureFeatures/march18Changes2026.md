# March 18, 2026 — Backend Changes: Frontend Integration Guide

**Date:** 2026-03-18
**Purpose:** Document all backend changes from this sprint that the frontend team needs to be aware of.

---

## 1. IEP Module — NEW TOP-LEVEL ROUTE

**Breaking Change:** IEP endpoints have moved to a new top-level module instead of being nested under students.

### Old Pattern (not implemented, was planned as):
```
POST /students/{sStudentId}/iep
GET /students/{sStudentId}/iep
```

### New Pattern:
```
POST /iep              — Body includes sStudentId
GET  /iep?sStudentId=xxx  — sStudentId as query param
```

**Frontend Action Required:**
- Update all IEP API calls to use `/iep` instead of `/students/{id}/iep`
- For GET: pass `sStudentId` as a query parameter
- For POST (upsert): include `sStudentId` in the request body along with all IEP fields

**Response format:**
```json
// POST /iep
{ "message": "IEP guardado exitosamente.", "oData": { "sIepId", "sStudentId", "sStatus", "dtUpdatedAt" }, "success": true }

// GET /iep?sStudentId=xxx
{ "message": "Success", "oData": { ...full IEP object... } | null, "success": true }
```

---

## 2. GET /schools/analytics — ENHANCED RESPONSE

The analytics endpoint now accepts date filters and returns significantly more data.

**Query params (new):** `?tStartDate=2026-03-01&tEndDate=2026-03-18`

**New fields in response:**
| Field | Type | Description |
|-------|------|-------------|
| `sStudentsTrend` | string | "+5.2%" or "-3.1%" trend vs previous period |
| `sGoalsTrend` | string | Same format for goals completion trend |
| `iGoalProgress` | integer | Now calculated as AVG(dProgress) of active goals (was completion rate) |
| `aChartLabels` | string[] | Month abbreviations in Spanish: ["Ene", "Feb", ...] |
| `aGoalsTotalByMonth` | integer[] | Goals created per month in date range |
| `aGoalsCompletedByMonth` | integer[] | Goals completed per month in date range |

**Frontend Action Required:**
- Pass `tStartDate` and `tEndDate` query params from date filter
- Map `aChartLabels`, `aGoalsTotalByMonth`, `aGoalsCompletedByMonth` to TrendChart component
- Update dashboard stats cards to use new trend fields

---

## 3. GET /schools — ADDED COMPUTED FIELDS

Each school in the list now includes:

| New Field | Type | Description |
|-----------|------|-------------|
| `iUsers` | integer | Count of active school users |
| `iStudents` | integer | Count of active students |
| `SchoolUser[0].sUserId` | string | The admin user's ID (added) |

**Frontend Action Required:** The `iUsers` and `iStudents` fields are now available directly on each school object — no need for separate lookups.

---

## 4. GET /schools/{id} — ADDED COMPUTED FIELDS

| New Field | Type | Description |
|-----------|------|-------------|
| `iUsers` | integer | Count of active school users |
| `iStudents` | integer | Count of active students |
| `iGoals` | integer | Count of active goals for this school |
| `sGoalsProgress` | string | Average progress as string integer "0"-"100" |

---

## 5. GET /students — ADDED iStudentsLimit + RESPONSE KEY CHANGES

**New fields:**
| Field | Description |
|-------|-------------|
| `iStudentsLimit` | The school's maximum student limit |
| `aData` | Same as `students` (added for standardization) |
| `iTotalItems` | Same as `iTotal` (added for standardization) |

**Frontend Action Required:** Can now use `response.data.iStudentsLimit` directly instead of making a separate school lookup.

---

## 6. Login Response — ADDED sPhone & aPermissions

**New fields in `results`:**
```json
{
  "sPhone": "+521234567890",
  "aPermissions": [
    { "sModuleId": "uuid", "sModuleName": "Students", "sAction": "DELETE" }
  ]
}
```

**Frontend Action Required:**
- Map `sPhone: oResults.sPhone || ''` into the user object in `login.vue`
- The `aPermissions` array now uses `sAction` (not `sActionCode`) — matches frontend IPermission interface
- Super school admins get full permissions automatically

---

## 7. NEW: Tracking Records Endpoints

### Available endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trackingRecords` | Create a tracking record |
| GET | `/goals/{id}/trackingRecords` | List records for a goal |
| PATCH | `/trackingRecords/{id}/toggleExclusion` | Toggle exclusion from average |
| DELETE | `/trackingRecords/{id}` | Soft delete a record |
| POST | `/trackingRecords/{id}/files` | Upload record evidence files |
| GET | `/trackingRecords/{id}/files` | List record files |
| DELETE | `/trackingRecords/{id}/files/{fileId}` | Delete record file |

### Field mapping (frontend → backend):
The backend accepts frontend field names and returns both:
- `dtDate` / `tRecordDate` — Record date
- `sNotes` / `sObservations` — Notes
- `iCorrect` / `iHits` — EXACTITUD correct count
- `iFrequencyCount` / `iOccurrences` — FRECUENCIA count
- `iSuccessful` / `iAchieved` — OPORTUNIDAD successful
- `iOpportunities` / `iTotal` — OPORTUNIDAD total
- `sRecordId` / `sTrackingRecordId` — Record ID
- `aTasksCompleted` — Array of task IDs (TAREAS type)
- `aDocuments` — Attached files (always returned, empty array if none)

### POST response includes `dUpdatedProgress`:
```json
{
  "oData": { ...record with both field name formats... },
  "dUpdatedProgress": 87.5,
  "success": true
}
```

**Frontend Action Required:**
- Replace all mock/hardcoded record operations with API calls
- After record creation, update goal's `dProgress` with `dUpdatedProgress` from response
- Goal detail page should call `GET /goals/{id}/trackingRecords` on mount

---

## 8. NEW: School Users CRUD Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schoolUsers` | List school users (paginated, searchable) |
| POST | `/schoolUsers` | Create user with invitation email |
| GET | `/schoolUsers/{id}` | Get one user |
| PUT | `/schoolUsers/{id}` | Update user (email immutable) |
| POST | `/schoolUsers/{id}/resetPassword` | Send password reset email |

### GET /schoolUsers response includes:
```json
{
  "aData": [...],
  "iTotalItems": 12,
  "iCurrentUsers": 12,
  "iMaxUsers": 30
}
```

**Frontend Action Required:**
- Replace all hardcoded/dummy data in Users module with API calls
- Use `iCurrentUsers` / `iMaxUsers` for limit display

---

## 9. NEW: Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/profile` | Update name and phone |
| PUT | `/profile/password` | Change password (requires current password) |

**Password validation (backend enforces):** min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char (!@#$%^&*)

**Frontend Action Required:**
- Replace `setTimeout` mocks in profile page with real API calls
- After profile save, update auth store locally with new name/phone

---

## 10. NEW: Student Report Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students/{id}/report?tStartDate=&tEndDate=` | Full student progress report |

Returns: student info, summary stats, all goals with their tracking records.

---

## 11. Goals — iBaselineValue Added

The Goals table now supports `iBaselineValue` (integer, default 10) for FRECUENCIA type progress calculation.

**Frontend Action Required:** If GoalForm sends `iBaselineValue`, the backend now stores it.

---

## 12. S3 Images — Code Review

Backend S3 image handling is correct:
- Uses pre-signed URLs with 7-day expiration
- Schools model `$afterFind` auto-generates `oImages` with all sizes (xs, sm, md, lg, xlg)
- If images don't load, the issue is AWS S3 bucket CORS configuration, NOT backend code

**AWS Action Required (infrastructure):**
- Add CORS configuration to the S3 bucket allowing the frontend origin
- Ensure bucket policy allows `s3:GetObject` for the IAM user

---

## 13. Database Migrations to Run

Run `npm run db:migrations` to apply:
- `3021_TrackingRecords.ts` — TrackingRecords table
- `3022_TrackingRecordTasks.ts` — Junction table for TAREAS type
- `3023_Goals_iBaselineValue.ts` — Add iBaselineValue column to Goals
- `3024_IEPs.ts` — IEPs table
- `3025_TrackingRecordFiles.ts` — TrackingRecord file attachments

---

*End of March 18, 2026 Changes Guide*
