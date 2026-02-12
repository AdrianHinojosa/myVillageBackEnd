# Front-End Changes Log

This document tracks field name differences between the front-end and back-end so the front-end team knows what adjustments are needed.

---

## General Conventions

| Convention | Front-End | Back-End | Notes |
|---|---|---|---|
| Date prefix | `dt` (e.g. `dtStartDate`) | `t` (e.g. `tStartDate`) | Front-end must map `dt` to `t` when sending to API |
| Timestamps | `dtCreatedAt`, `dtUpdatedAt` | `created_at`, `updated_at` | Knex auto-generates snake_case timestamps |
| ID convention | Matches back-end | `s{TableName}Id` | e.g. `sStudentId`, `sGoalId` |

---

## Schools Module

| Front-End Field | Back-End Field | Notes |
|---|---|---|
| `sAdminName` (single field) | `sName`, `sLastName`, `sSecondLastName` | Front-end should split into 3 separate fields for User creation |
| `sAdminEmail` | `sEmail` | Used for User creation (not School table) |
| `oLogo` (file upload) | `sImageKey` (S3 key) | Front-end uploads file via `POST /schools/image`; back-end stores S3 key |
| `iUsers`, `iStudents` (computed) | Not stored fields | Computed via COUNT queries in getAllSchools response |

---

## Students Module

| Front-End Field | Back-End Field | Notes |
|---|---|---|
| `sBirthYear` (string in form) | `iBirthYear` (integer) | Front-end sends string, back-end expects integer |

All other fields match: `sStudentId`, `sName`, `sLastName`, `sSecondLastName`, `sGrade`, `sGroup`, `sDiagnosis`, `sNotes`, `bActive`

---

## Goals Module

| Front-End Field | Back-End Field | Notes |
|---|---|---|
| `dtStartDate` | `tStartDate` | Date prefix mapping |
| `dtTargetDate` | `tTargetDate` | Date prefix mapping |
| `dtCompletedDate` | `tCompletedDate` | Date prefix mapping |
| `dtLastRecord` | `tLastRecord` | Date prefix mapping |

All other fields match: `sGoalId`, `sStudentId`, `sTitle`, `sDescription`, `sMeasurementType`, `sStatus`, `iTargetValue`, `iTargetDuration`, `iScaleMin`, `iScaleMax`, `sFrequencyUnit`, `dProgress`, `dAverageValue`, `iRecordsCount`

---

## GoalTasks Module

| Front-End Field | Back-End Field | Notes |
|---|---|---|
| `sTaskId` | `sGoalTaskId` | Back-end follows `s{TableName}Id` convention |

All other fields match: `sTitle`, `bCompleted`, `iOrder`

---

## GoalFiles Module

Fields match the standard Files pattern: `sGoalFileId`, `sGoalId`, `sFileKey`, `sFileName`, `sFileType`
