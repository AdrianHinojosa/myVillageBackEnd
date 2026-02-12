import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { UsersModel } from '../../004_Users/users.model';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface ISessions {
    sSessionId?: string;
    sUserId?: string;
    sToken?: string;
    bActive?: boolean;
    tExpiresAt?: Date;
}

export class SessionsModel extends Model {
    public sSessionId?: string;
    public sUserId?: string;
    public sToken?: string;
    public bActive?: boolean;
    public tExpiresAt?: Date;

    static tableName: string = 'Sessions';

    static idColumn: string | string[] = 'sSessionId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        RecoverySessions: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'Sessions.sUserId',
                to: 'Users.sUserId'
            }
        },
    };
}

