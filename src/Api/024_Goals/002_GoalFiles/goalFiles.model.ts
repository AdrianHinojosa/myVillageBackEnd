import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { GoalsModel } from '../goals.model';
import { FilesModel } from '../../009_Files/files.model';

Model.knex(db);

export interface IGoalFile {
    sGoalFileId?: string;
    sGoalId?: string;
}

export class GoalFilesModel extends Model {
    public sGoalFileId?: string;
    public sGoalId?: string;

    static tableName: string = 'GoalFiles';
    static idColumn: string | string[] = 'sGoalFileId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Goal: {
            relation: Model.BelongsToOneRelation,
            modelClass: GoalsModel,
            join: {
                from: 'GoalFiles.sGoalId',
                to: 'Goals.sGoalId'
            }
        },
        File: {
            relation: Model.BelongsToOneRelation,
            modelClass: FilesModel,
            join: {
                from: 'GoalFiles.sGoalFileId',
                to: 'Files.sFileId'
            }
        }
    };
}
