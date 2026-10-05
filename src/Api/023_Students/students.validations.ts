import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

// Feature 2 — verificar folio (identidad compartida) con nombre completo + fecha de nacimiento.
export const VerifyFolioBody = Validations.JoiObjectKeys({
    sFolio: Validations.RequiredUUID("Students sFolio"),
    sFullName: Validations.RequiredString("Students sFullName"),
    tBirthDate: Validations.Date("Students tBirthDate"),
});

export const CreateStudentBody = Validations.JoiObjectKeys({
    // Feature 2 — folio de una identidad existente; si viene, el alumno se liga a ella.
    sPersonId: Joi.string().guid({ version: ['uuidv4'] }).allow(null).allow('')
        .error(new Error("Students sPersonId")),
    sName: Validations.RequiredString("Students sName"),
    sLastName: Validations.RequiredString("Students sLastName"),
    sSecondLastName: Validations.String("Students sSecondLastName"),
    sCustomStudentId: Validations.String("Students sCustomStudentId"),
    iBirthYear: Validations.PositiveInteger("Students iBirthYear"),
    tBirthDate: Validations.Date("Students tBirthDate"),
    sGender: Validations.String("Students sGender"),
    sGrade: Validations.String("Students sGrade"),
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
