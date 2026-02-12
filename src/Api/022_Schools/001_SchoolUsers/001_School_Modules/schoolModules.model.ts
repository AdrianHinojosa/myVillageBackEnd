import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../../Config/Db.config';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface ISchoolModules {
    sSchoolModuleId?: string;
    sSchoolModuleCategoryId?: string;
    iType?: 0 | 1 | 2 | 3;
    sUniqueName?: string;
    sNameSP?: string;
    sNameEN?: string;
    sDescriptionSP?: string;
    sDescriptionEN?: string;
}

export class SchoolModulesModel extends Model {

    public sSchoolModuleId?: string;
    public sSchoolModuleCategoryId?: string;
    public iType?: 0 | 1 | 2 | 3;
    public sUniqueName?: string;
    public sNameSP?: string;
    public sNameEN?: string
    public sDescriptionSP?: string;
    public sDescriptionEN?: string;

    static tableName: string = 'SchoolModules';
    static idColumn: string | string[] = 'sSchoolModuleId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        SchoolPermissions: {
            relation: Model.ManyToManyRelation,
            modelClass: path.join(__dirname, 'administrators.model'),
            join: {
              from: 'SchoolModules.sSchoolModuleId',
              through: {
                from: 'SchoolPermissions.sSchoolModuleId',
                to: 'SchoolPermissions.sSchoolId'
              },
              to: 'Schools.sSchoolId'
            }
          }
    };
}
