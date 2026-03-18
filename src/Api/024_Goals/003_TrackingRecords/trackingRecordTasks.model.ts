import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { TrackingRecordsModel } from './trackingRecords.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';

Model.knex(db);

export interface ITrackingRecordTask {
    sTrackingRecordTaskId?: string;
    sTrackingRecordId?: string;
    sGoalTaskId?: string;
}

export class TrackingRecordTasksModel extends Model {
    public sTrackingRecordTaskId?: string;
    public sTrackingRecordId?: string;
    public sGoalTaskId?: string;

    static tableName: string = 'TrackingRecordTasks';
    static idColumn: string | string[] = 'sTrackingRecordTaskId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        TrackingRecord: {
            relation: Model.BelongsToOneRelation,
            modelClass: TrackingRecordsModel,
            join: {
                from: 'TrackingRecordTasks.sTrackingRecordId',
                to: 'TrackingRecords.sTrackingRecordId'
            }
        },
        GoalTask: {
            relation: Model.BelongsToOneRelation,
            modelClass: GoalTasksModel,
            join: {
                from: 'TrackingRecordTasks.sGoalTaskId',
                to: 'GoalTasks.sGoalTaskId'
            }
        }
    };
}
