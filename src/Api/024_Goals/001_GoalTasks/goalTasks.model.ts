import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';

Model.knex(db);

export interface IGoalTasks {
    sGoalTaskId?: string;
    sGoalId?: string;
    sTitle?: string;
    bCompleted?: boolean;
    iOrder?: number;
}

export class GoalTasksModel extends Model {
    public sGoalTaskId?: string;
    public sGoalId?: string;
    public sTitle?: string;
    public bCompleted?: boolean;
    public iOrder?: number;

    static tableName: string = 'GoalTasks';
    static idColumn: string | string[] = 'sGoalTaskId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {};

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
