import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { SchoolUsersModel } from './001_SchoolUsers/schoolUsers.model';

import path from 'path';
import moment from 'moment';
import { CitiesModel } from '../002_Cities/cities.model';
import StorageServices from '../../Services/Storage.services';


Model.knex(db);

export interface ISchools {
    sSchoolId?: string;
    sName?: string;
    sImageKey?: string;
    sPhone?: string;
    sCityId?: string;
    iUsersLimit?: number;
    iStudentsLimit?: number;
    bBlocked?: boolean;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    sLastDeletedBy?: string;
    bActive?: boolean;
}

export class SchoolsModel extends Model {
    public sSchoolId?: string;
    public sName?: string;
    public sImageKey?: string;
    public sPhone?: string;
    public sCityId?: string;
    public iUsersLimit?: number;
    public iStudentsLimit?: number;
    public bBlocked?: boolean;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public sLastDeletedBy?: string;
    public bActive?: boolean;

    static tableName: string = 'Schools';
    static idColumn: string | string[] = 'sSchoolId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        SchoolUser: {
            relation: Model.HasManyRelation,
            modelClass: SchoolUsersModel,
            join: {
                from: 'Schools.sSchoolId',
                to: 'SchoolUsers.sSchoolId'
            }
        },

        City: {
            relation: Model.BelongsToOneRelation,
            modelClass: CitiesModel,
            join: {
                from: 'Schools.sCityId',
                to: 'Cities.sCityId'
            }
        },
    };



    async $beforeUpdate() {
        this.updated_at = new Date();
    }

    async $afterFind() {
        // Flag get Image
        if (this.sImageKey) {
            this.oImages = await StorageServices.GetManyImages(this.sImageKey, ['xs', 'sm', 'md', 'lg', 'xlg']);
        }
        else {
            this.oImages = null;
        }

    }
}
