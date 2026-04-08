import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import StudentAssignmentQueries from './studentAssignments.queries';
import StudentQueries from '../023_Students/students.queries';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {};

    // POST /studentAssignments/:sStudentId — Assign a teacher to a student
    async assignTeacher(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.params;
        const {sSchoolUserId} = req.body;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Check if assignment already exists
        const existingAssignment = await StudentAssignmentQueries.findExistingAssignment(sStudentId, sSchoolUserId);
        if (existingAssignment) {
            return next(new MyError(409, ErrorMessages.StudentAssignments.alreadyAssigned[sLang]));
        }

        // Create assignment
        const newAssignment = await StudentAssignmentQueries.insertAssignment(sStudentId, sSchoolUserId);

        return res.status(201).json({
            message: SuccessMessages.StudentAssignments.assignTeacher[sLang],
            oData: newAssignment,
            success: true
        });
    }

    // DELETE /studentAssignments/:sStudentId/:sStudentAssignmentId — Unassign a teacher
    async unassignTeacher(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId, sStudentAssignmentId} = req.params;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // Verify assignment exists
        const myAssignment = await StudentAssignmentQueries.findAssignmentById(sStudentAssignmentId);
        if (!myAssignment) {
            return next(new MyError(404, ErrorMessages.StudentAssignments.notFound[sLang]));
        }

        // Delete assignment
        await StudentAssignmentQueries.deleteAssignment(sStudentAssignmentId);

        return res.status(200).json({
            message: SuccessMessages.StudentAssignments.unassignTeacher[sLang],
            success: true
        });
    }

    // GET /studentAssignments/:sStudentId — List assigned teachers for a student
    async getAssignments(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sStudentId} = req.params;

        // Verify student exists and belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        // FACULTY can only view assignments for their own students
        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        const result = await StudentAssignmentQueries.findAssignmentsByStudent(sStudentId);

        return res.status(200).json({
            aData: result.rows,
            success: true
        });
    }
}

export default new Controllers();
