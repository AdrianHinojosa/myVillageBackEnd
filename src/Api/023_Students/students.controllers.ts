import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import StudentQueries from './students.queries';
import SchoolQueries from '../022_Schools/schools.queries';
import GoalQueries from '../024_Goals/goals.queries';
import { TrackingRecordsModel } from '../024_Goals/003_TrackingRecords/trackingRecords.model';
import { TrackingRecordTasksModel } from '../024_Goals/003_TrackingRecords/trackingRecordTasks.model';
import { db } from '../../Config/Db.config';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Create a student
    async createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

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
        const {sLang, sSchoolId} = res.locals;
        const {iPageNumber, iItemsPerPage, sSearch, sGrade} = req.query;

        const myStudents = await StudentQueries.findAllStudents(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sGrade);
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
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.params;

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
        const {sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

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

    // GET /students/:sStudentId/report — Student progress report
    async getStudentReport(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.params;
        const {tStartDate, tEndDate} = req.query;

        // Verify student belongs to school
        const myStudent = await StudentQueries.findOneStudent(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Default date range: current month (use local date, not UTC)
        const now = new Date();
        const sStart = tStartDate ? String(tStartDate) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const sEnd = tEndDate ? String(tEndDate) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Get all goals for student with their tasks
        const goalsResult = await GoalQueries.findGoalsByStudent(sStudentId, 1, 1000, null, null);
        const aGoals = goalsResult.results;

        // Get all records for all goals filtered by date range
        const aGoalIds = aGoals.map((g: any) => g.sGoalId);
        let allRecords: any[] = [];
        if (aGoalIds.length > 0) {
            allRecords = await TrackingRecordsModel.query()
                .whereIn('sGoalId', aGoalIds)
                .where('bActive', true)
                .whereNull('tDeletedAt')
                .modify(function(qb: any) {
                    if (sStart) qb.where('tRecordDate', '>=', sStart);
                    if (sEnd) qb.where('tRecordDate', '<=', sEnd);
                })
                .orderBy('tRecordDate', 'desc');
        }

        // Calculate summary (scoped to goals with records in date range)
        const goalIdsWithRecords = new Set(allRecords.map((r: any) => r.sGoalId));
        const iActiveGoals = aGoals.filter((g: any) => g.sStatus === 'ACTIVE').length;
        const iCompletedGoals = aGoals.filter((g: any) => g.sStatus === 'COMPLETED').length;
        const iNotAchievedGoals = aGoals.filter((g: any) => g.sStatus === 'NOT_ACHIEVED').length;
        const activeGoalsWithRecords = aGoals.filter((g: any) => g.sStatus === 'ACTIVE' && goalIdsWithRecords.has(g.sGoalId));
        const dAverageProgress = activeGoalsWithRecords.length > 0
            ? activeGoalsWithRecords.reduce((sum: number, g: any) => sum + (parseFloat(g.dProgress) || 0), 0) / activeGoalsWithRecords.length
            : 0;
        const iOverdueGoals = aGoals.filter((g: any) => g.sStatus === 'ACTIVE' && g.tTargetDate && new Date(g.tTargetDate) < now).length;

        // Format records with frontend field names
        const formattedRecords = allRecords.map((r: any) => ({
            ...r,
            sRecordId: r.sTrackingRecordId,
            dtDate: r.tRecordDate,
            sNotes: r.sObservations,
            iCorrect: r.iHits,
            iTotal: (r.iHits !== null && r.iErrors !== null) ? r.iHits + r.iErrors : r.iTotal,
            iFrequencyCount: r.iOccurrences,
            iSuccessful: r.iAchieved,
            iOpportunities: r.iTotal,
        }));

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
