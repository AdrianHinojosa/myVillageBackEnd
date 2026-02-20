import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';

export const CreateGoalTaskParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("GoalTasks sGoalId"),
});

export const CreateGoalTaskBody = Validations.JoiObjectKeys({
    sTitle: Validations.RequiredString("GoalTasks sTitle"),
    bCompleted: Validations.Boolean("GoalTasks bCompleted"),
    iOrder: Validations.PositiveInteger("GoalTasks iOrder"),
});

export const GetGoalTasksParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("GoalTasks sGoalId"),
});

export const UpdateGoalTaskParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("GoalTasks sGoalId"),
    sGoalTaskId: Validations.RequiredUUID("GoalTasks sGoalTaskId"),
});

export const UpdateGoalTaskBody = Validations.JoiObjectKeys({
    sTitle: Validations.RequiredString("GoalTasks sTitle"),
    bCompleted: Validations.RequiredBoolean("GoalTasks bCompleted"),
    iOrder: Validations.RequiredPositiveInteger("GoalTasks iOrder"),
});

export const ToggleGoalTaskParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("GoalTasks sGoalId"),
    sGoalTaskId: Validations.RequiredUUID("GoalTasks sGoalTaskId"),
});

export const ToggleGoalTaskBody = Validations.JoiObjectKeys({
    bCompleted: Validations.RequiredBoolean("GoalTasks bCompleted"),
});

export const DeleteGoalTaskParams = Validations.JoiObjectKeys({
    sGoalId: Validations.RequiredUUID("GoalTasks sGoalId"),
    sGoalTaskId: Validations.RequiredUUID("GoalTasks sGoalTaskId"),
});
