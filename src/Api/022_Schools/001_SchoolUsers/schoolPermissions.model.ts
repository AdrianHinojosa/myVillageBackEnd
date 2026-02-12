import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import path from 'path';
import moment from 'moment';
import {SchoolModulesModel} from './001_School_Modules/schoolModules.model';


Model.knex(db);

export interface ISchoolPermissions {
    sSchoolPermissionId?: string;
    sSchoolUserId?: string;
    sSchoolModuleId?: string;
    sActionCode?: string;
}

export class SchoolPermissionsModel extends Model {
    public sSchoolPermissionId?: string;
    public sSchoolUserId?: string;
    public sSchoolModuleId?: string;
    public sActionCode?: string;

    static tableName: string = 'SchoolPermissions';

    static idColumn: string | string[] = 'sSchoolPermissionId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        SchoolModule: {
            relation: Model.BelongsToOneRelation,
            modelClass: path.join(__dirname, './001_School_Modules/schoolModules.model'),
            join: {
                from: 'SchoolPermissions.sSchoolModuleId',
                to: 'SchoolModules.sSchoolModuleId'
            }
        },
        School: {
            relation: Model.BelongsToOneRelation,
            modelClass: path.join(__dirname, 'administrators.model'),
            join: {
                from: 'SchoolPermissions.sSchoolId',
                to: 'School.sSchoolId'
            }
        }
    };
}
