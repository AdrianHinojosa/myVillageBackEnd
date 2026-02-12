import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import StudentController from './students.controllers';
import * as StudentValidations from './students.validations';
import { verifySchoolUserPermissions } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

const router = Router();

// Create
router.post('/',
    celebrate({ body: StudentValidations.CreateStudentBody }),
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    aH(StudentController.createStudent));

// Get ALL
router.get('/',
    celebrate({ query: StudentValidations.GetStudentsQuery }),
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
    aH(StudentController.getAllStudents));

// Get ONE
router.get('/:sStudentId',
    celebrate({ params: StudentValidations.GetStudentParams }),
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'READ' }  ])),
    aH(StudentController.getOneStudent));

// Update
router.put('/:sStudentId',
    celebrate({ params: StudentValidations.UpdateStudentParams, body: StudentValidations.UpdateStudentBody }),
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    aH(StudentController.updateStudent));

// Delete
router.delete('/:sStudentId',
    celebrate({ params: StudentValidations.DeleteStudentParams }),
    aH(verifySchoolUserPermissions(  [  {sModuleName: 'General', sActionCode: 'WRITE' }  ])),
    aH(StudentController.deleteStudent));

export default router;
