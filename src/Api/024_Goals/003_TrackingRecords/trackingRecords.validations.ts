import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';
import { HELP_TYPE_SLUGS, MAX_HELP_TYPES_PER_RECORD, MIN_HELP_AMOUNT, MAX_HELP_AMOUNT } from './helpTypes';

// P8 — one entry per kind of support given in this session.
const HelpTypeItem = Joi.object({
    sHelpType: Joi.string().valid(...HELP_TYPE_SLUGS).required()
        .error(new Error("TrackingRecordHelps sHelpType")),
    iHelpAmount: Joi.number().integer().min(MIN_HELP_AMOUNT).max(MAX_HELP_AMOUNT).required()
        .error(new Error("TrackingRecordHelps iHelpAmount"))
});

// Several help types per record, each with its own amount. `unique` rejects the same type twice.
const HelpTypesArray = Joi.array().items(HelpTypeItem)
    .max(MAX_HELP_TYPES_PER_RECORD)
    .unique('sHelpType')
    .allow(null)
    .error(new Error("TrackingRecords aHelpTypes"));

// TEMPORARY compatibility shim — the single help type the frontend still sends today.
// Remove both keys once it ships the multi-type capture UI (frontEndChanges.md entry 1).
const LegacyHelpType = Joi.string().valid(...HELP_TYPE_SLUGS).allow('').allow(null)
    .error(new Error("TrackingRecords sHelpType"));
const LegacyHelpAmount = Joi.number().integer().min(MIN_HELP_AMOUNT).max(MAX_HELP_AMOUNT).allow(null)
    .error(new Error("TrackingRecords iHelpAmount"));

export const CreateTrackingRecordBody = Joi.object({
    // P7 — a record belongs EITHER to a goal or to a subgoal. The frontend posts `sSubGoalId` for
    // subgoal records (SubGoalsManager.vue) and never supplies `sGoalId` in that case, so neither
    // can be unconditionally required; exactly one must be present (enforced by `.xor` below).
    sGoalId: Validations.UUID("TrackingRecords sGoalId"),
    sSubGoalId: Validations.UUID("TrackingRecords sSubGoalId"),
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
    // P8 — tipos de ayuda (documental; never affects any calculation)
    aHelpTypes: HelpTypesArray,
    sHelpType: LegacyHelpType,
    iHelpAmount: LegacyHelpAmount,
}).xor('sGoalId', 'sSubGoalId').options({ allowUnknown: true })
  .error(new Error("TrackingRecords sGoalId"));

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

export const UpdateTrackingRecordParams = Validations.JoiObjectKeys({
    sTrackingRecordId: Validations.RequiredUUID("TrackingRecords sTrackingRecordId"),
    sLang: Joi.string(),
});

export const UpdateTrackingRecordBody = Joi.object({
    dtDate: Validations.Date("TrackingRecords dtDate"),
    sNotes: Validations.String("TrackingRecords sNotes"),
    // P8 — sending aHelpTypes REPLACES the stored set; omitting it leaves it untouched
    aHelpTypes: HelpTypesArray,
    sHelpType: LegacyHelpType,
    iHelpAmount: LegacyHelpAmount,
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
