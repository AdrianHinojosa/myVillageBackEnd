import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { TrackingRecordsModel } from './trackingRecords.model';
import { FilesModel } from '../../009_Files/files.model';

Model.knex(db);

export interface ITrackingRecordFile {
    sTrackingRecordFileId?: string;
    sTrackingRecordId?: string;
}

export class TrackingRecordFilesModel extends Model {
    public sTrackingRecordFileId?: string;
    public sTrackingRecordId?: string;

    static tableName: string = 'TrackingRecordFiles';
    static idColumn: string | string[] = 'sTrackingRecordFileId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        TrackingRecord: {
            relation: Model.BelongsToOneRelation,
            modelClass: TrackingRecordsModel,
            join: {
                from: 'TrackingRecordFiles.sTrackingRecordId',
                to: 'TrackingRecords.sTrackingRecordId'
            }
        },
        File: {
            relation: Model.BelongsToOneRelation,
            modelClass: FilesModel,
            join: {
                from: 'TrackingRecordFiles.sTrackingRecordFileId',
                to: 'Files.sFileId'
            }
        }
    };
}
