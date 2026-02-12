import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import path from 'path';
import { CountriesModel } from '../001_Countries/countries.model';
import { SessionsModel } from '../003_Authentication/002_Sessions/sessions.model';
import { RecoverySessionsModel } from '../003_Authentication/001_RecoverySessions/recoverySessions.model';
import moment from 'moment';

Model.knex(db);

export interface IUsers {
    sUserId?: string;
    sName?: string;
    sLastName?: string;
    sSecondLastName?: string;
    sEmail?: string;
    sPassword?: string;
    sImageKey?: string;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    sPhoneNumber?: string;
    sPhoneExtension?: string;
    bPlatformAccess?: boolean;
    bVerified?: boolean;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class UsersModel extends Model {
    public sUserId?: string;
    public sName?: string;
    public sLastName?: string;
    public sSecondLastName?: string;
    public sEmail?: string;
    public sPassword?: string;
    public sImageKey?: string;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public sPhoneNumber?: string;
    public sPhoneExtension?: string;
    public bPlatformAccess?: boolean;
    public bVerified?: boolean;

    public bActive?: boolean;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'Users';

    static idColumn: string | string[] = 'sUserId';
    static timestamps = true; 

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Sessions: {
            relation: Model.HasManyRelation,
            modelClass: SessionsModel,
            join: {
                from: 'Users.sUserId',
                to: 'Sessions.sUserId'
            }
        },
        RecoverySessions: {
            relation: Model.HasManyRelation,
            modelClass: RecoverySessionsModel,
            join: {
                from: 'Users.sUserId',
                to: 'RecoverySessions.sRecoverySessionId'
            }
        },

        CreatedByUser: {
            relation: Model.HasOneRelation,
            modelClass:  path.join(__dirname, 'users.model'),
            join: {
                from: 'Users.sCreatedBy',
                to: 'Users.sUserId'
            }
        },

        LastUpdatedByUser: {
            relation: Model.HasOneRelation,
            modelClass:  path.join(__dirname, 'users.model'),
            join: {
                from: 'Users.sLastUpdatedBy',
                to: 'Users.sUserId'
            }
        },
    };

    async $afterFind(queryContext: QueryContext) {
        // Only delete password if not explicitly keeping it
        if (!queryContext.keepPassword) {
            delete this.sPassword;
        }
    }

    async $beforeUpdate() {
        this.updated_at = new Date();
    }

}