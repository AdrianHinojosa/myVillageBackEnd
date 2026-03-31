import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const UpsertIepBody = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("IEPs sStudentId"),
    sStatus: Joi.string().valid('DRAFT', 'ACTIVE', 'ARCHIVED').allow(null).allow('').error(new Error("IEPs sStatus")),
    aExternalServices: Joi.array().allow(null).error(new Error("IEPs aExternalServices")),
    sParentNames: Validations.String("IEPs sParentNames"),
    sParentConcerns: Validations.String("IEPs sParentConcerns"),
    sSchoolAssignment: Validations.String("IEPs sSchoolAssignment"),
    sSchoolAssignmentOther: Validations.String("IEPs sSchoolAssignmentOther"),
    sStrengths: Validations.String("IEPs sStrengths"),
    sAreasOfOpportunity: Validations.String("IEPs sAreasOfOpportunity"),
    sCognitiveEvaluations: Validations.String("IEPs sCognitiveEvaluations"),
    sSubjectGrades: Validations.String("IEPs sSubjectGrades"),
    sEvaluationResults: Validations.String("IEPs sEvaluationResults"),
    sCommunicationComments: Validations.String("IEPs sCommunicationComments"),
    sMotorComments: Validations.String("IEPs sMotorComments"),
    sSocioemotionalComments: Validations.String("IEPs sSocioemotionalComments"),
    sIndependenceComments: Validations.String("IEPs sIndependenceComments"),
    aFocusAreas: Joi.array().items(Joi.string()).allow(null).error(new Error("IEPs aFocusAreas")),
    sFocusAreasSubjects: Validations.String("IEPs sFocusAreasSubjects"),
    aAccommodations: Joi.array().items(Joi.string()).allow(null).error(new Error("IEPs aAccommodations")),
    sOtherAccommodations: Validations.String("IEPs sOtherAccommodations"),
    bRequiresModifications: Validations.Boolean("IEPs bRequiresModifications"),
    aModifications: Joi.array().allow(null).error(new Error("IEPs aModifications")),
    aObjectives: Joi.array().allow(null).error(new Error("IEPs aObjectives")),
    dtIepStartDate: Validations.Date("IEPs dtIepStartDate"),
    dtIepReviewDate: Validations.Date("IEPs dtIepReviewDate"),
    sNotes: Validations.String("IEPs sNotes"),
    aTeamMembers: Joi.array().items(Joi.object({
        sTeamMemberId: Joi.string(),
        sName: Joi.string(),
        sRole: Joi.string()
    })).allow(null).error(new Error("IEPs aTeamMembers")),
});

export const GetIepQuery = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("IEPs sStudentId"),
});
