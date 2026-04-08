import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import StudentAssignmentController from './studentAssignments.controllers';
import * as StudentAssignmentValidations from './studentAssignments.validations';
import { verifySchoolUserPermissions, denyFacultyAccess } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// POST /:sStudentId — Assign a teacher to a student
router.post('/:sStudentId',
    celebrate({ params: StudentAssignmentValidations.AssignTeacherParams, body: StudentAssignmentValidations.AssignTeacherBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(denyFacultyAccess() as any),
    aH(StudentAssignmentController.assignTeacher));

// DELETE /:sStudentId/:sStudentAssignmentId — Unassign a teacher
router.delete('/:sStudentId/:sStudentAssignmentId',
    celebrate({ params: StudentAssignmentValidations.UnassignTeacherParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    aH(denyFacultyAccess() as any),
    aH(StudentAssignmentController.unassignTeacher));

// GET /:sStudentId — List assigned teachers for a student
router.get('/:sStudentId',
    celebrate({ params: StudentAssignmentValidations.GetAssignmentsParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'READ' }])),
    aH(StudentAssignmentController.getAssignments));

export default router;
