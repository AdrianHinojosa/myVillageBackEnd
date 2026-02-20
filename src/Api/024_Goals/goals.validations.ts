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
    iTargetDuration: Validations.PositiveInteger("Goals iTargetDuration"),
    iScaleMin: Validations.PositiveInteger("Goals iScaleMin"),
    iScaleMax: Validations.PositiveInteger("Goals iScaleMax"),
    sFrequencyUnit: Validations.String("Goals sFrequencyUnit"),
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
    iTargetDuration: Validations.PositiveInteger("Goals iTargetDuration"),
    iScaleMin: Validations.PositiveInteger("Goals iScaleMin"),
    iScaleMax: Validations.PositiveInteger("Goals iScaleMax"),
    sFrequencyUnit: Validations.String("Goals sFrequencyUnit"),
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
    sStatus: Joi.string().valid('COMPLETED', 'NOT_ACHIEVED').required().error(new Error("Goals sStatus")),
    sCompletionNotes: Validations.String("Goals sCompletionNotes"),
});

export const DeleteGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});
