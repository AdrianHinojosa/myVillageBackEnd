import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';

export const CreateTrackingRecordBody = Joi.object({
    sGoalId: Validations.RequiredUUID("TrackingRecords sGoalId"),
    dtDate: Validations.Date("TrackingRecords dtDate"),
    sNotes: Validations.String("TrackingRecords sNotes"),
    // EXACTITUD
    iCorrect: Validations.PositiveInteger("TrackingRecords iCorrect"),
    iTotal: Validations.PositiveInteger("TrackingRecords iTotal"),
    // ESCALA
    iScaleValue: Validations.PositiveInteger("TrackingRecords iScaleValue"),
    // FRECUENCIA
    iFrequencyCount: Validations.PositiveInteger("TrackingRecords iFrequencyCount"),
    // DURACION
    iDurationMinutes: Validations.PositiveNumber("TrackingRecords iDurationMinutes"),
    // OPORTUNIDAD
    iSuccessful: Validations.PositiveInteger("TrackingRecords iSuccessful"),
    iOpportunities: Validations.PositiveInteger("TrackingRecords iOpportunities"),
    // TAREAS
    aTasksCompleted: Joi.array().items(Joi.string().guid()).allow(null).error(new Error("TrackingRecords aTasksCompleted")),
}).options({ allowUnknown: true });

export const GetTrackingRecordsByGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("TrackingRecords sGoalId"),
});

export const GetTrackingRecordsByGoalQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    tStartDate: Validations.Date("TrackingRecords tStartDate"),
    tEndDate: Validations.Date("TrackingRecords tEndDate"),
});

export const GetTrackingRecordParams = Validations.JoiObjectKeys({
    sTrackingRecordId: Validations.RequiredUUID("TrackingRecords sTrackingRecordId"),
    sLang: Joi.string(),
});

export const ToggleExclusionParams = Validations.JoiObjectKeys({
    sTrackingRecordId: Validations.RequiredUUID("TrackingRecords sTrackingRecordId"),
    sLang: Joi.string(),
});

export const ToggleExclusionBody = Validations.JoiObjectKeys({
    bExcludedFromAverage: Validations.RequiredBoolean("TrackingRecords bExcludedFromAverage"),
});

export const DeleteTrackingRecordParams = Validations.JoiObjectKeys({
    sTrackingRecordId: Validations.RequiredUUID("TrackingRecords sTrackingRecordId"),
    sLang: Joi.string(),
});
