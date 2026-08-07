import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';

/**
 * Punto 7 — Submetas.
 *
 * A subgoal payload IS a goal payload: the frontend reuses `GoalForm.vue` with `bIsSubGoal`, so it
 * sends the same body shape. Four of those fields are accepted and then **ignored** rather than
 * rejected, because the frontend always sends them and a 409 would break the form:
 *
 *   sTitle            — inherited from the parent goal (the input is hidden in subgoal mode, so it
 *                       arrives empty anyway)
 *   sMeasurementType  — inherited and immutable; the contract fixes it for all subgoals of a goal
 *   bHasSubGoals      — meaningless on a subgoal: only one level of nesting is allowed
 *   aDocuments        — handled by the separate goalFiles upload endpoint
 */
const IgnoredInheritedFields = {
    sTitle: Joi.any().strip(),
    sMeasurementType: Joi.any().strip(),
    bHasSubGoals: Joi.any().strip(),
    aDocuments: Joi.any().strip(),
};

const SubGoalConfigFields = {
    sDescription: Validations.String("SubGoals sDescription"),
    tStartDate: Validations.Date("SubGoals tStartDate"),
    tTargetDate: Validations.Date("SubGoals tTargetDate"),
    tCompletedDate: Validations.Date("SubGoals tCompletedDate"),
    sCompletionNotes: Validations.String("SubGoals sCompletionNotes"),
    iTargetValue: Validations.PositiveInteger("SubGoals iTargetValue"),
    iTargetDuration: Validations.PositiveNumber("SubGoals iTargetDuration"),
    iScaleMin: Validations.PositiveInteger("SubGoals iScaleMin"),
    iScaleMax: Validations.PositiveInteger("SubGoals iScaleMax"),
    sFrequencyUnit: Validations.String("SubGoals sFrequencyUnit"),
    iBaselineValue: Validations.PositiveInteger("SubGoals iBaselineValue"),
    sDirection: Validations.String("SubGoals sDirection"),
    iTargetOpportunities: Validations.PositiveInteger("SubGoals iTargetOpportunities"),
    // Listed in the signed scope document: "porcentaje objetivo (numérico, valor de 0 a 100)"
    iTargetPercentage: Joi.number().integer().min(0).max(100).allow(null)
        .error(new Error("SubGoals iTargetPercentage")),
    // Independent per subgoal (PO decision — no sequential machine). ACTIVE by default.
    sStatus: Joi.string().valid('ACTIVE', 'COMPLETED', 'NOT_ACHIEVED', 'PAUSED').allow(null)
        .error(new Error("SubGoals sStatus")),
    aTasks: Joi.array().items(Joi.object({
        sTitle: Joi.string().required(),
        bCompleted: Joi.boolean(),
        iOrder: Joi.number().integer().min(0)
    })).allow(null).error(new Error("SubGoals aTasks")),
};

export const GetSubGoalsParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
    sLang: Joi.string(),
});

export const CreateSubGoalParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
    sLang: Joi.string(),
});

export const CreateSubGoalBody = Validations.JoiObjectKeys({
    ...SubGoalConfigFields,
    ...IgnoredInheritedFields,
});

export const UpdateSubGoalParams = Validations.JoiObjectKeys({
    sSubGoalId: Validations.RequiredUUID("SubGoals sSubGoalId"),
    sLang: Joi.string(),
});

export const UpdateSubGoalBody = Validations.JoiObjectKeys({
    ...SubGoalConfigFields,
    ...IgnoredInheritedFields,
});

export const DeleteSubGoalParams = Validations.JoiObjectKeys({
    sSubGoalId: Validations.RequiredUUID("SubGoals sSubGoalId"),
    sLang: Joi.string(),
});

export const GetSubGoalRecordsParams = Validations.JoiObjectKeys({
    sSubGoalId: Validations.RequiredUUID("SubGoals sSubGoalId"),
    sLang: Joi.string(),
});

export const GetSubGoalRecordsQuery = Validations.JoiObjectKeys({
    ...Validations.Filters,
    tStartDate: Validations.Date("TrackingRecords tStartDate"),
    tEndDate: Validations.Date("TrackingRecords tEndDate"),
});
