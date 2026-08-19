import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { TrackingRecordsModel } from './trackingRecords.model';

Model.knex(db);

export interface ITrackingRecordHelp {
    sTrackingRecordHelpId?: string;
    sTrackingRecordId?: string;
    sHelpType?: string;
    iHelpAmount?: number;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class TrackingRecordHelpsModel extends Model {
    public sTrackingRecordHelpId?: string;
    public sTrackingRecordId?: string;
    public sHelpType?: string;
    public iHelpAmount?: number;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'TrackingRecordHelps';
    static idColumn: string | string[] = 'sTrackingRecordHelpId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        TrackingRecord: {
            relation: Model.BelongsToOneRelation,
            modelClass: TrackingRecordsModel,
            join: {
                from: 'TrackingRecordHelps.sTrackingRecordId',
                to: 'TrackingRecords.sTrackingRecordId'
            }
        }
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
