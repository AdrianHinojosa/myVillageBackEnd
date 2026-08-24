import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import StudentQueries from './students.queries';
import SchoolQueries from '../022_Schools/schools.queries';
import GoalQueries from '../024_Goals/goals.queries';
import StudentAssignmentQueries from '../028_StudentAssignments/studentAssignments.queries';
import { GoalsModel } from '../024_Goals/goals.model';
import { TrackingRecordsModel } from '../024_Goals/003_TrackingRecords/trackingRecords.model';
import { TrackingRecordTasksModel } from '../024_Goals/003_TrackingRecords/trackingRecordTasks.model';
import { TrackingRecordHelpsModel } from '../024_Goals/003_TrackingRecords/trackingRecordHelps.model';
import { formatHelpTypesForFrontend } from '../024_Goals/003_TrackingRecords/helpTypes';
import { db } from '../../Config/Db.config';
import StorageServices from '../../Services/Storage.services';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Feature 2 — verifica un folio (identidad compartida) con nombre completo + fecha de nacimiento.
    // Se usa en el alta cuando el colegio quiere cargar un alumno que ya existe en otra institución.
    async verifyByFolio(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sFolio, sFullName, tBirthDate} = req.body;

        const oPerson = await StudentQueries.verifyPersonByFolio(sFolio, sFullName, tBirthDate);
        if (!oPerson) {
            // Genérico a propósito: no revela si el folio existe ni qué dato no coincidió.
            return next(new MyError(404, ErrorMessages.Students.folioNotFound[sLang]));
        }

        return res.status(200).json({
            message: SuccessMessages.Students.folioVerified[sLang],
            person: {
                sPersonId: oPerson.sPersonId,
                sName: oPerson.sName,
                sLastName: oPerson.sLastName,
                sSecondLastName: oPerson.sSecondLastName,
                tBirthDate: oPerson.tBirthDate,
            },
            success: true
        });
    }

    // Create a student
    async createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sPersonId, sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

        // Validate student limit
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {
            return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        }

        const iCurrentStudents = await StudentQueries.findCountOfActiveStudentsBySchool(sSchoolId);
        if (iCurrentStudents >= mySchool.iStudentsLimit) {
            return next(new MyError(400, ErrorMessages.Students.limitReached[sLang]));
        }

        // Feature 2 — alta por folio existente: re-verifica identidad (defensa) y evita duplicados.
        if (sPersonId) {
            const sFullName = [sName, sLastName, sSecondLastName].filter(Boolean).join(' ');
            const oPerson = await StudentQueries.verifyPersonByFolio(sPersonId, sFullName, tBirthDate);
            if (!oPerson) {
                return next(new MyError(409, ErrorMessages.Students.folioMismatch[sLang]));
            }
            const oExisting = await StudentQueries.findActiveStudentBySchoolAndPerson(sSchoolId, sPersonId);
            if (oExisting) {
                return next(new MyError(409, ErrorMessages.Students.alreadyLinked[sLang]));
            }
        }

        // Insert student (crea o reusa la identidad compartida según venga sPersonId)
        const newStudent = await StudentQueries.insertStudentWithIdentity({
            sSchoolId,
            sPersonId,
            sName,
            sLastName,
            sSecondLastName,
            sCustomStudentId,
            iBirthYear,
            tBirthDate,
            sGender,
            sGrade,
            sGroup,
            sDiagnosis,
            sNotes,
            sCreatedBy: sUserId
        });

        return res.status(201).json({
            message: SuccessMessages.Students.createStudent[sLang],
            student: newStudent,
            success: true
        });
    }

    // Get ALL Students (paginated)
    async getAllStudents(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {iPageNumber, iItemsPerPage, sSearch, sGrade} = req.query;

        // Check if user is FACULTY — if so, only show assigned students
        let aAssignedStudentIds: string[] = null;
        if (res.locals.sType === 'FACULTY') {
            aAssignedStudentIds = await StudentAssignmentQueries.findAssignedStudentIds(sUserId);
        }

        const myStudents = await StudentQueries.findAllStudents(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sGrade, aAssignedStudentIds);
        const iNumPages = Math.ceil(myStudents.total / Number(iItemsPerPage));

        // Get school's student limit
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        const iStudentsLimit = mySchool ? mySchool.iStudentsLimit : 0;

        return res.status(201).json({
            message: SuccessMessages.Students.getAllStudents[sLang],
            aData: myStudents.results,
            students: myStudents.results,
            iTotalItems: myStudents.total,
            iTotal: myStudents.total,
            iNumPages: iNumPages,
            iStudentsLimit,
            success: true
        });
    }

    // Get ONE Student
    async getOneStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId} = req.params;

        // FACULTY can only view assigned students
        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        const myStudent = await StudentQueries.findOneStudent(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        return res.status(201).json({
            message: SuccessMessages.Students.getOneStudent[sLang],
            student: myStudent,
            success: true
        });
    }

    // Update a Student
    async updateStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId} = req.params;
        const {sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Update student
        const updatedStudent = await StudentQueries.updateStudent(sStudentId, {
            sName,
            sLastName,
            sSecondLastName,
            sCustomStudentId,
            iBirthYear,
            tBirthDate,
            sGender,
            sGrade,
            sGroup,
            sDiagnosis,
            sNotes,
            sLastUpdatedBy: sUserId
        });

        return res.status(201).json({
            message: SuccessMessages.Students.updateStudent[sLang],
            student: updatedStudent,
            success: true
        });
    }

    // Delete a Student (soft delete)
    async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId} = req.params;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Soft delete student
        await StudentQueries.deleteStudent(sStudentId, sUserId);

        return res.status(201).json({
            message: SuccessMessages.Students.deleteStudent[sLang],
            success: true
        });
    }

    // POST /students/:sStudentId/image — Upload student image
    async uploadStudentImage(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.params;
        var {bDeleteImage} = req.body;

        bDeleteImage = (String(bDeleteImage).toLowerCase() === 'true');

        // Validate that the student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        var sImageKey = '';

        // Delete current image
        await StorageServices.DeleteFromImageKey(myStudent.sImageKey);

        // If we want to add or replace an image:
        if (bDeleteImage == false) {
            const arrFiles = req.files;
            if (!arrFiles) return next(new MyError(400, ErrorMessages.UploadImages.FileNotFound[sLang]));

            const Upload: any = arrFiles.oImage;

            if (Array.isArray(Upload)) {
                return next(new MyError(400, ErrorMessages.UploadImages.moreThanAllowedImages[sLang]));
            }
            else {
                sImageKey = await StorageServices.UploadManyImages(Upload.data, 'studentImages');
            }
        }

        // Update Student with Image
        const updatedStudent = await StudentQueries.updateStudentImage(sStudentId, sImageKey);

        return res.status(201).json({
            message: SuccessMessages.Students.uploadStudentImage[sLang],
            student: updatedStudent,
            success: true
        });
    }

    // GET /students/:sStudentId/report — Student progress report
    async getStudentReport(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId} = req.params;
        const {tStartDate, tEndDate} = req.query;

        // FACULTY can only view reports for assigned students
        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        // Verify student belongs to school
        const myStudent = await StudentQueries.findOneStudent(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Default date range: current month (use local date, not UTC)
        // Note: Joi.date() converts query params to JS Date objects, so we must convert back to YYYY-MM-DD strings
        const now = new Date();
        const sStart = tStartDate
            ? (tStartDate instanceof Date ? tStartDate.toISOString().split('T')[0] : String(tStartDate))
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const sEnd = tEndDate
            ? (tEndDate instanceof Date ? tEndDate.toISOString().split('T')[0] : String(tEndDate))
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Get all goals for student with their tasks. This deliberately returns only top-level
        // goals — subgoals are never reported as goals of their own.
        const goalsResult = await GoalQueries.findGoalsByStudent(sStudentId, 1, 1000, null, null);
        const allGoalIds = goalsResult.results.map((g: any) => g.sGoalId);

        /**
         * P7 — a divided goal keeps its records in its SUBGOALS, never on itself. Querying only
         * `allGoalIds` therefore found nothing for those goals, and since the report keeps only
         * goals that have records, a divided goal disappeared from the report altogether.
         *
         * Fix: also query the subgoals' records, and attribute each one to its PARENT so it lands
         * in the parent's card. Every record additionally carries `sSubGoalId`/`sSubGoalTitle` so
         * the PDF can tell which stage produced it.
         */
        const oSubGoalToParent: Record<string, string> = {};
        const oSubGoalTitles: Record<string, string> = {};
        if (allGoalIds.length > 0) {
            const aSubGoals = await GoalsModel.query()
                .select('sGoalId', 'sParentGoalId', 'sTitle')
                .whereIn('sParentGoalId', allGoalIds)
                .where('bActive', true);
            for (const oSub of aSubGoals as any[]) {
                oSubGoalToParent[oSub.sGoalId] = oSub.sParentGoalId;
                oSubGoalTitles[oSub.sGoalId] = oSub.sTitle;
            }
        }
        const aQueryableGoalIds = [...allGoalIds, ...Object.keys(oSubGoalToParent)];

        // Get all records within date range, then use them to determine which goals had activity
        let allRecords: any[] = [];
        if (aQueryableGoalIds.length > 0) {
            allRecords = await TrackingRecordsModel.query()
                .whereIn('sGoalId', aQueryableGoalIds)
                .where('bActive', true)
                .whereNull('tDeletedAt')
                .modify(function(qb: any) {
                    if (sStart) qb.whereRaw('"tRecordDate"::date >= ?', [sStart]);
                    if (sEnd) qb.whereRaw('"tRecordDate"::date <= ?', [sEnd]);
                })
                .orderBy('tRecordDate', 'desc');
        }

        // Only include goals that have at least one record in the date range — counting a subgoal's
        // records as records of its parent.
        const sGoalIdsWithRecords = new Set(
            allRecords.map((r: any) => oSubGoalToParent[r.sGoalId] || r.sGoalId)
        );
        const aGoals = goalsResult.results.filter((g: any) => sGoalIdsWithRecords.has(g.sGoalId));

        // Calculate summary — all stats scoped to the date range
        const iActiveGoals = aGoals.filter((g: any) => g.sStatus === 'ACTIVE').length;
        const iCompletedGoals = aGoals.filter((g: any) => {
            if (g.sStatus !== 'COMPLETED' || !g.tCompletedDate) return false;
            const completedDate = new Date(g.tCompletedDate).toISOString().split('T')[0];
            return completedDate >= sStart && completedDate <= sEnd;
        }).length;
        const iNotAchievedGoals = aGoals.filter((g: any) => {
            if (g.sStatus !== 'NOT_ACHIEVED' || !g.tCompletedDate) return false;
            const completedDate = new Date(g.tCompletedDate).toISOString().split('T')[0];
            return completedDate >= sStart && completedDate <= sEnd;
        }).length;
        const activeGoals = aGoals.filter((g: any) => g.sStatus === 'ACTIVE');
        const dAverageProgress = activeGoals.length > 0
            ? activeGoals.reduce((sum: number, g: any) => sum + (parseFloat(g.dProgress) || 0), 0) / activeGoals.length
            : 0;
        const iOverdueGoals = aGoals.filter((g: any) => g.sStatus === 'ACTIVE' && g.tTargetDate && new Date(g.tTargetDate) < now).length;

        /**
         * P8 — help types for every record of the report, in ONE query.
         *
         * The report used to omit `aHelpTypes` entirely, so the frontend patched around it by calling
         * `GET /goals/:id/trackingRecords` once per goal and merging by record id
         * (`students/[id]/index.vue`). That patch cost N extra requests **and** lost the help types of
         * every DIVIDED goal, because a divided goal's records live in its subgoals and that endpoint
         * returns none of them. Returning them here fixes both at once and lets the patch go away.
         */
        const aReportRecordIds = allRecords.map((r: any) => r.sTrackingRecordId);
        const oHelpsByRecord: { [key: string]: any[] } = {};
        if (aReportRecordIds.length > 0) {
            const aAllHelps = await TrackingRecordHelpsModel.query()
                .whereIn('sTrackingRecordId', aReportRecordIds)
                .orderBy('iHelpAmount', 'desc');
            for (const oHelp of aAllHelps as any[]) {
                if (!oHelpsByRecord[oHelp.sTrackingRecordId]) oHelpsByRecord[oHelp.sTrackingRecordId] = [];
                oHelpsByRecord[oHelp.sTrackingRecordId].push(oHelp);
            }
        }

        // Format records with frontend field names + aTasksCompleted for TAREAS goals
        const formattedRecords = [];
        for (const r of allRecords) {
            // Fetch task completions from junction table
            let aTasksCompleted = [];
            const taskCompletions = await TrackingRecordTasksModel.query()
                .select('sGoalTaskId')
                .where('sTrackingRecordId', r.sTrackingRecordId);
            aTasksCompleted = taskCompletions.map((t: any) => t.sGoalTaskId);

            // P7 — when the record belongs to a subgoal, say which one. `sGoalId` keeps pointing at
            // the row's real owner; the grouping below is what moves it into the parent's card.
            const sParentOfRecord = oSubGoalToParent[r.sGoalId] || null;

            formattedRecords.push({
                ...r,
                sSubGoalId: sParentOfRecord ? r.sGoalId : null,
                sSubGoalTitle: sParentOfRecord ? (oSubGoalTitles[r.sGoalId] || null) : null,
                // P8 — same shape the record endpoints return, so the frontend needs no special case.
                aHelpTypes: formatHelpTypesForFrontend(oHelpsByRecord[r.sTrackingRecordId] || []),
                sRecordId: r.sTrackingRecordId,
                dtDate: r.tRecordDate,
                sNotes: r.sObservations,
                iCorrect: r.iHits,
                iTotal: (r.iHits !== null && r.iErrors !== null) ? r.iHits + r.iErrors : r.iTotal,
                iFrequencyCount: r.iOccurrences,
                iSuccessful: r.iAchieved,
                iOpportunities: r.iTotal,
                aTasksCompleted,
            });
        }

        // Group records by goalId — a subgoal's records are grouped under its PARENT (P7), so a
        // divided goal's card shows every record logged across its stages.
        const recordsByGoal = {};
        for (const r of formattedRecords) {
            const sBucket = oSubGoalToParent[r.sGoalId] || r.sGoalId;
            if (!recordsByGoal[sBucket]) recordsByGoal[sBucket] = [];
            recordsByGoal[sBucket].push(r);
        }

        // Build goal response with records
        const aGoalsWithRecords = aGoals.map((g: any) => ({
            ...g,
            aGoalTasks: g.GoalTasks || [],
            aRecords: recordsByGoal[g.sGoalId] || []
        }));

        return res.status(200).json({
            message: 'Success',
            oData: {
                oStudent: {
                    sStudentId: myStudent.sStudentId,
                    sFullName: myStudent.sFullName,
                    sGrade: myStudent.sGrade,
                    sGroup: myStudent.sGroup
                },
                oSummary: {
                    iTotalGoals: aGoals.length,
                    iActiveGoals,
                    iCompletedGoals,
                    iNotAchievedGoals,
                    iTotalRecords: allRecords.length,
                    dAverageProgress: Math.round(dAverageProgress * 10) / 10,
                    iOverdueGoals
                },
                aGoals: aGoalsWithRecords
            },
            success: true
        });
    }
}

export default new Controllers();
