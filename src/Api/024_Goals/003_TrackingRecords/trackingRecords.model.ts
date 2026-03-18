import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { GoalsModel } from '../goals.model';
import { GoalTasksModel } from '../001_GoalTasks/goalTasks.model';

Model.knex(db);

export interface ITrackingRecord {
    sTrackingRecordId?: string;
    sGoalId?: string;
    sGoalTaskId?: string;
    tRecordDate?: string;
    sSupportUsed?: string;
    sObservations?: string;
    iHits?: number;
    iErrors?: number;
    iScaleValue?: number;
    iOccurrences?: number;
    iDurationMinutes?: number;
    iAchieved?: number;
    iTotal?: number;
    bExcludedFromAverage?: boolean;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    bActive?: boolean;
    tDeletedAt?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class TrackingRecordsModel extends Model {
    public sTrackingRecordId?: string;
    public sGoalId?: string;
    public sGoalTaskId?: string;
    public tRecordDate?: string;
    public sSupportUsed?: string;
    public sObservations?: string;
    public iHits?: number;
    public iErrors?: number;
    public iScaleValue?: number;
    public iOccurrences?: number;
    public iDurationMinutes?: number;
    public iAchieved?: number;
    public iTotal?: number;
    public bExcludedFromAverage?: boolean;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public bActive?: boolean;
    public tDeletedAt?: string;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'TrackingRecords';
    static idColumn: string | string[] = 'sTrackingRecordId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Goal: {
            relation: Model.BelongsToOneRelation,
            modelClass: GoalsModel,
            join: {
                from: 'TrackingRecords.sGoalId',
                to: 'Goals.sGoalId'
            }
        },
        GoalTask: {
            relation: Model.BelongsToOneRelation,
            modelClass: GoalTasksModel,
            join: {
                from: 'TrackingRecords.sGoalTaskId',
                to: 'GoalTasks.sGoalTaskId'
            }
        }
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
