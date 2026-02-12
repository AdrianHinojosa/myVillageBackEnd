import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';

// Used
export const useGoalFileParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
});

// Used
export const CreateGoalFileBody = Validations.JoiObjectKeys({
    oFile: Joi.array().items().error(new Error("GoalFiles oFile")),
    sArrGoalFileNames: Joi.alternatives().try(
                        Joi.array().items( Joi.string().trim().required() ),
                        Joi.string().trim().required()
                    ).error(new Error("GoalFiles sArrGoalFileNames")),
});

// Used
export const GetGoalFilesQuery = Validations.JoiObjectKeys({
    ...Validations.FiltersNoPagination,
});

// Used
export const GetGoalFileParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
    sGoalFileId: Validations.RequiredUUID("GoalFiles sGoalFileId"),
});

// Used
export const DeleteGoalFileParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("Goals sGoalId"),
    sGoalFileId: Validations.RequiredUUID("GoalFiles sGoalFileId"),
});

export const Filters = Validations.Filters;
