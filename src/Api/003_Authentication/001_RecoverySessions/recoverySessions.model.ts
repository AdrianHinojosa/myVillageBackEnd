import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { UsersModel } from '../../004_Users/users.model';
import moment from 'moment';

Model.knex(db);

export interface ISessions {
    sRecoverySessionId?: string;
    sUserId?: string;
    sToken?: string;
    bActive?: boolean;
    tExpiresAt?: Date;
}

export class RecoverySessionsModel extends Model {
    public sRecoverySessionId?: string;
    public sUserId?: string;
    public sToken?: string;
    public bActive?: boolean;
    public tExpiresAt?: Date;

    static tableName: string = 'RecoverySessions';

    static idColumn: string | string[] = 'sRecoverySessionId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        RecoverySessions: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'RecoverySessions.sUserId',
                to: 'Users.sUserId'
            }
        },
    };
}

