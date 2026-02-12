import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { UsersModel } from  '../../004_Users/users.model';
import { SchoolPermissionsModel } from  './schoolPermissions.model';

import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface ISchoolUser {
    sSchoolUserId?: string;
    sSchoolId?: string;
}

export class SchoolUsersModel extends Model {
    public sSchoolUserId?: string;
    public sSchoolId?: string;

    static tableName: string = 'SchoolUsers';
    static idColumn: string | string[] = 'sSchoolUserId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        User: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'SchoolUsers.sSchoolUserId',
                to: 'Users.sUserId',
            },
        },

        SchoolPermissions: {
            relation: Model.HasManyRelation,
            modelClass: SchoolPermissionsModel,
            join: {
                from: 'SchoolUsers.sSchoolUserId',
                to: 'SchoolPermissions.sSchoolUserId',
            },
        }
    };
}
