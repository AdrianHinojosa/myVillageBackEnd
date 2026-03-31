import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const AssignTeacherParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("StudentAssignments sStudentId"),
    sLang: Joi.string(),
});

export const AssignTeacherBody = Validations.JoiObjectKeys({
    sSchoolUserId: Validations.RequiredUUID("StudentAssignments sSchoolUserId"),
});

export const UnassignTeacherParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("StudentAssignments sStudentId"),
    sStudentAssignmentId: Validations.RequiredUUID("StudentAssignments sStudentAssignmentId"),
    sLang: Joi.string(),
});

export const GetAssignmentsParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("StudentAssignments sStudentId"),
    sLang: Joi.string(),
});
