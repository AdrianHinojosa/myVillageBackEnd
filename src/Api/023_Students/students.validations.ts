import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateStudentBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    iBirthYear: Validations.RequiredPositiveInteger("Students iBirthYear"),
    sGrade: Validations.RequiredString("Students sGrade"),
    sGroup: Validations.String("Students sGroup"),
    sDiagnosis: Validations.String("Students sDiagnosis"),
    sNotes: Validations.String("Students sNotes"),
});

export const GetStudentsQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    sGrade: Validations.String("Students sGrade"),
});

export const GetStudentParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Students sStudentId"),
});

export const UpdateStudentBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    iBirthYear: Validations.RequiredPositiveInteger("Students iBirthYear"),
    sGrade: Validations.RequiredString("Students sGrade"),
    sGroup: Validations.String("Students sGroup"),
    sDiagnosis: Validations.String("Students sDiagnosis"),
    sNotes: Validations.String("Students sNotes"),
});

export const UpdateStudentParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Students sStudentId"),
});

export const DeleteStudentParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Students sStudentId"),
});

export const Filters = Validations.Filters;
