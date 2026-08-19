import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const CreateGoalBody = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Goals sStudentId"),
    sTitle: Validations.RequiredString("Goals sTitle"),
    sDescription: Validations.String("Goals sDescription"),
    sMeasurementType: Joi.string().valid('EXACTITUD', 'TAREAS', 'ESCALA', 'FRECUENCIA', 'DURACION', 'OPORTUNIDAD').required().error(new Error("Goals sMeasurementType")),
    tStartDate: Validations.Date("Goals tStartDate"),
    tTargetDate: Validations.Date("Goals tTargetDate"),
    iTargetValue: Validations.PositiveInteger("Goals iTargetValue"),
    iTargetDuration: Validations.PositiveNumber("Goals iTargetDuration"),
    iScaleMin: Validations.PositiveInteger("Goals iScaleMin"),
    iScaleMax: Validations.PositiveInteger("Goals iScaleMax"),
    sFrequencyUnit: Validations.String("Goals sFrequencyUnit"),
    iBaselineValue: Validations.PositiveInteger("Goals iBaselineValue"),
    sDirection: Validations.String("Goals sDirection"),
    iTargetOpportunities: Validations.PositiveInteger("Goals iTargetOpportunities"),
    iTargetPercentage: Joi.number().integer().min(0).max(100).allow(null).error(new Error("Goals iTargetPercentage")),
    // P7 — the frontend's GoalForm sends this on create ("¿Deseas dividir esta meta en submetas?").
    // Without it the strict schema rejected the whole payload with 409.
    bHasSubGoals: Validations.Boolean("Goals bHasSubGoals"),
    aTasks: Joi.array().items(Joi.object({
        sTitle: Joi.string().required(),
        iOrder: Joi.number().integer().min(0)
    })).allow(null).error(new Error("Goals aTasks"))
});

export const GetGoalsByStudentParams = Validations.JoiObjectKeys({
    sStudentId: Validations.RequiredUUID("Goals sStudentId"),
});

export const GetGoalsByStudentQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    sStatus: Validations.String("Goals sStatus"),
});

export const GetGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});

export const UpdateGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});

export const UpdateGoalBody = Validations.JoiObjectKeys({
    sTitle: Validations.RequiredString("Goals sTitle"),
    sDescription: Validations.String("Goals sDescription"),
    tStartDate: Validations.Date("Goals tStartDate"),
    tTargetDate: Validations.Date("Goals tTargetDate"),
    iTargetValue: Validations.PositiveInteger("Goals iTargetValue"),
    iTargetDuration: Validations.PositiveNumber("Goals iTargetDuration"),
    iScaleMin: Validations.PositiveInteger("Goals iScaleMin"),
    iScaleMax: Validations.PositiveInteger("Goals iScaleMax"),
    sFrequencyUnit: Validations.String("Goals sFrequencyUnit"),
    iBaselineValue: Validations.PositiveInteger("Goals iBaselineValue"),
    sDirection: Validations.String("Goals sDirection"),
    iTargetOpportunities: Validations.PositiveInteger("Goals iTargetOpportunities"),
    iTargetPercentage: Joi.number().integer().min(0).max(100).allow(null).error(new Error("Goals iTargetPercentage")),
    // P7 — allows dividing an existing goal later, not only at creation.
    bHasSubGoals: Validations.Boolean("Goals bHasSubGoals"),
    aTasks: Joi.array().items(Joi.object({
        sTitle: Joi.string().required(),
        bCompleted: Joi.boolean(),
        iOrder: Joi.number().integer().min(0)
    })).allow(null).error(new Error("Goals aTasks"))
});

export const CompleteGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});

export const CompleteGoalBody = Validations.JoiObjectKeys({
    // P7 — PAUSED added: the DB always allowed it but the API did not, so it was unreachable.
    sStatus: Joi.string().valid('COMPLETED', 'NOT_ACHIEVED', 'ACTIVE', 'PAUSED').required().error(new Error("Goals sStatus")),
    sCompletionNotes: Validations.String("Goals sCompletionNotes"),
});

export const DeleteGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});
