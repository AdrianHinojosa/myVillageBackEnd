# Backend Fix: `sUserType` in Login Response

**Endpoint:** `POST /auth/login`
**Priority:** HIGH

## What we need

In the login response, inside `results.sUserType`, return one of these exact values based on the user type:

| Value | For which users |
|-------|----------------|
| `'SchoolAdmin'` | Main school admin user + SchoolUsers with `sType: 'ADMINISTRATION'` |
| `'FACULTY'` | SchoolUsers with `sType: 'FACULTY'` (teachers) |
| `'SuperAdmin'` | Platform SuperAdmins |

## Logic

```typescript
let sUserType;
if (user is SuperAdmin) {
  sUserType = 'SuperAdmin';
} else if (user.sType === 'ADMINISTRATION' || user is school main admin) {
  sUserType = 'SchoolAdmin';
} else if (user.sType === 'FACULTY') {
  sUserType = 'FACULTY';
}
```

## Expected response

```json
{
  "results": {
    "sUserId": "uuid",
    "sEmail": "user@school.com",
    "sFullName": "...",
    "sUserType": "SchoolAdmin",
    "sToken": "jwt...",
    "oSchool": { ... },
    "aPermissions": [...]
  }
}
```

## Access control

**SchoolAdmin** (main school admin) AND **ADMINISTRATION** (SchoolUser with `sType: 'ADMINISTRATION'`) → see ALL students in their school. Both can:
- Create / Edit / Delete the **student record itself** (the student's personal info: name, grade, photo, etc.)
- Assign or unassign teachers to a student
- Manage other users
- Plus everything FACULTY can do

**FACULTY** (SchoolUser with `sType: 'FACULTY'`) → ONLY sees students assigned to them via StudentAssignments. They CANNOT:
- Create new students
- Edit the student's personal info (name, grade, photo, etc.)
- Delete students
- Assign or unassign teachers to a student

What FACULTY users CAN do (for their assigned students only):
- View the student's profile
- Create / edit / delete **goals** for the student
- Record progress (tracking records)
- View and edit the **IEP**
- View and download **reports**

**Important distinction:** "Create/edit/delete students" refers ONLY to the student record itself (personal info). It does NOT refer to goals, IEPs, reports, or tracking records — those are separate entities that FACULTY users CAN manage for their assigned students.

## How frontend uses it

- `sUserType === 'SchoolAdmin'` → admin view: full access
- `sUserType === 'FACULTY'` → restricted view: only assigned students, no student record management

## Important

- Values are case-sensitive: `SchoolAdmin`, `FACULTY` (uppercase), `SuperAdmin`
- Do NOT use `Staff` or `Teacher` — those values do not exist in the response
- Affects how the frontend shows/hides buttons and how `GET /students` filters results

---

*Generated: April 2, 2026*


Endpoints FACULTY users CAN access:                                                                               
                                                                                                                    
  Students                                                                                                          
  - GET /students (filtered: only assigned students)                                                                
  - GET /students/:id (only if assigned)                                                                            
  - GET /students/:id/assignments (see their own assignments)
  - GET /students/:id/report (only assigned)                                                                        
                  
  Goals                                                                                                             
  - GET /goals/student/:id (only for assigned students)
  - GET /goals/:id                                                                                                  
  - POST /goals (create goal for assigned student)
  - PUT /goals/:id (edit goal)                                                                                      
  - DELETE /goals/:id (delete goal)
  - PATCH /goals/:id/complete (complete goal)                                                                       
                                                                                                                    
  Goal Tasks
  - GET /goals/:id/goalTasks                                                                                        
  - PUT /goals/:id/goalTasks/:taskId

  Goal Files                                                                                                        
  - GET /goals/:id/goalFiles
  - POST /goals/:id/goalFiles                                                                                       
  - DELETE /goals/:id/goalFiles/:fileId

  Tracking Records                                                                                                  
  - GET /goals/:id/trackingRecords
  - POST /trackingRecords                                                                                           
  - PATCH /trackingRecords/:id/toggleExclusion
  - DELETE /trackingRecords/:id               
  - POST /trackingRecords/:id/files                                                                                 
  - GET /trackingRecords/:id/files 
  - DELETE /trackingRecords/:id/files/:fileId                                                                       
                                                                                                                    
  IEP
  - GET /students/:id/iep                                                                                           
  - POST /iep (upsert)   

  Profile (own only, read-only)                                                                                     
  - GET /profile
                                                                                                                    
  Auth            
  - POST /auth/login
  - POST /auth/logout (if exists)

  ---                                                                                                               
  Endpoints DENIED for FACULTY:
                                                                                                                    
  - POST /students (create student)
  - PUT /students/:id (edit student info)
  - DELETE /students/:id                                                                                            
  - POST /students/:id/image (student photo)
  - POST /students/:id/assignments (assign other teachers)                                                          
  - DELETE /students/:id/assignments/:id                                                                            
  - GET /schoolUsers (users list)
  - POST /schoolUsers (create user)                                                                                 
  - PUT /schoolUsers/:id                                                                                            
  - DELETE /schoolUsers/:id
  - POST /schoolUsers/:id/resetPassword                                                                             
  - PUT /profile (edit own profile)                                                                                 
  - PUT /profile/password
  - All /schools/* (SuperAdmin only)                                                                                
  - GET /schools/analytics (SuperAdmin only)

  