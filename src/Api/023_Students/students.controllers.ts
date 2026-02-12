import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import StudentQueries from './students.queries';
import SchoolQueries from '../022_Schools/schools.queries';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {
    };

    // Create a student
    async createStudent(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sName, sLastName, sSecondLastName, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

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

        return res.status(201).json({
            message: SuccessMessages.Students.getAllStudents[sLang],
            students: myStudents.results,
            iTotal: myStudents.total,
            iNumPages: iNumPages,
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
        const {sName, sLastName, sSecondLastName, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes} = req.body;

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
}

export default new Controllers();
