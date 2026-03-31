import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateStudentBody = Validations.JoiObjectKeys({
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    sCustomStudentId: Validations.String("Students sCustomStudentId"),
    iBirthYear: Validations.PositiveInteger("Students iBirthYear"),
    tBirthDate: Validations.Date("Students tBirthDate"),
    sGender: Validations.String("Students sGender"),
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
    sCustomStudentId: Validations.String("Students sCustomStudentId"),
    iBirthYear: Validations.PositiveInteger("Students iBirthYear"),
    tBirthDate: Validations.Date("Students tBirthDate"),
    sGender: Validations.String("Students sGender"),
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

export const UploadStudentImageParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Students sStudentId"),
});

export const UploadStudentImageBody = Validations.JoiObjectKeys({
    bDeleteImage: Validations.RequiredBoolean('Students bDeleteImage'),
});

export const GetStudentReportQuery = Validations.JoiObjectKeys({
    tStartDate: Validations.Date("Students tStartDate"),
    tEndDate: Validations.Date("Students tEndDate"),
});

export const Filters = Validations.Filters;
