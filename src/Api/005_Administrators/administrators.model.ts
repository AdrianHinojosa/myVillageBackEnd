import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import path from 'path';
import moment from 'moment';
import {UsersModel} from '../004_Users/users.model'

Model.knex(db);

export interface IAdministrators {
    sAdministratorId?: string;
    sManagerId?: string;
    iCode?: number;
    iAdminCode?: number;
    sName?: string;
    sLastName?: string;
    sEmail?: string;
    sPassword?: string;
    sUserPictureFileKey?: string;
    sPhoneNumber?: string;
    sPhoneExtension?: string;
    bPlatformAccess?: boolean;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class AdministratorsModel extends Model {
    public sAdministratorId?: string;
    public sManagerId?: string;
    public iCode?: number;
    public iAdminCode?: number;
    public sName?: string;
    public sLastName?: string;
    public sEmail?: string;
    public sPassword?: string;
    public sUserPictureFileKey?: string;
    public sPhoneNumber?: string;
    public sPhoneExtension?: string;
    public bPlatformAccess?: boolean;
    public bActive?: boolean;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'Administrators';
    static idColumn: string | string[] = 'sAdministratorId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Manager: {
            relation: Model.BelongsToOneRelation,
            modelClass: AdministratorsModel,
            join: {
                from: 'Administrators.sAdministratorId',
                to: 'Administrators.sManagerId'
            }
        },

        User: {
            relation: Model.BelongsToOneRelation,
            modelClass: UsersModel, // path.join(__dirname, 'users.model'),
            join: {
                from: 'Administrators.sAdministratorId',
                to: 'Users.sUserId'
            }
        },

        AdministratorPermissions: {
            relation: Model.HasManyRelation,
            modelClass: path.join(__dirname, 'administrator_permissions.model'),
            join: {
                from: 'Administrators.sAdministratorId',
                to: 'AdministratorPermissions.sAdministratorId'
            }
        }
    };
}

