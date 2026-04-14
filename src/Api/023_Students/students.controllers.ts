import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import StudentQueries from './students.queries';
import SchoolQueries from '../022_Schools/schools.queries';
import GoalQueries from '../024_Goals/goals.queries';
import StudentAssignmentQueries from '../028_StudentAssignments/studentAssignments.queries';
import { TrackingRecordsModel } from '../024_Goals/003_TrackingRecords/trackingRecords.model';
import { TrackingRecordTasksModel } from '../024_Goals/003_TrackingRecords/trackingRecordTasks.model';
import { db } from '../../Config/Db.config';
import StorageServices from '../../Services/Storage.services';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Create a student
    async createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

        // Validate student limit
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {
            return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        }

        const iCurrentStudents = await StudentQueries.findCountOfActiveStudentsBySchool(sSchoolId);
        if (iCurrentStudents >= mySchool.iStudentsLimit) {
            return next(new MyError(400, ErrorMessages.Students.limitReached[sLang]));
        }

        // Insert student
        const newStudent = await StudentQueries.insertStudent({
            sSchoolId,
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

        // Get all goals for student with their tasks
        const goalsResult = await GoalQueries.findGoalsByStudent(sStudentId, 1, 1000, null, null);
        const allGoalIds = goalsResult.results.map((g: any) => g.sGoalId);

        // Get all records within date range, then use them to determine which goals had activity
        let allRecords: any[] = [];
        if (allGoalIds.length > 0) {
            allRecords = await TrackingRecordsModel.query()
                .whereIn('sGoalId', allGoalIds)
                .where('bActive', true)
                .whereNull('tDeletedAt')
                .modify(function(qb: any) {
                    if (sStart) qb.whereRaw('"tRecordDate"::date >= ?', [sStart]);
                    if (sEnd) qb.whereRaw('"tRecordDate"::date <= ?', [sEnd]);
                })
                .orderBy('tRecordDate', 'desc');
        }

        // Only include goals that have at least one record in the date range
        const sGoalIdsWithRecords = new Set(allRecords.map((r: any) => r.sGoalId));
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

        // Format records with frontend field names + aTasksCompleted for TAREAS goals
        const formattedRecords = [];
        for (const r of allRecords) {
            // Fetch task completions from junction table
            let aTasksCompleted = [];
            const taskCompletions = await TrackingRecordTasksModel.query()
                .select('sGoalTaskId')
                .where('sTrackingRecordId', r.sTrackingRecordId);
            aTasksCompleted = taskCompletions.map((t: any) => t.sGoalTaskId);

            formattedRecords.push({
                ...r,
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

        // Group records by goalId
        const recordsByGoal = {};
        for (const r of formattedRecords) {
            if (!recordsByGoal[r.sGoalId]) recordsByGoal[r.sGoalId] = [];
            recordsByGoal[r.sGoalId].push(r);
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
