import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../../Config/Db.config';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface ISchoolModuleCategories {
    sSchoolModuleCategoryId?: string;
    sIcon?: string;
    sNameSP?: string;
    sNameEN?: string;
    sDescriptionSP?: string;
    sDescriptionEN?: string;
}

export class SchoolModuleCategoriesModel extends Model {
    public sSchoolModuleCategoryId?: string;
    public sIcon?: string;
    public sNameSP?: string;
    public sNameEN?: string
    public sDescriptionSP?: string;
    public sDescriptionEN?: string;

    static tableName: string = 'SchoolModuleCategories';
    static idColumn: string | string[] = 'sSchoolModuleCategoryId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        SchoolModules: {
            relation: Model.HasManyRelation,
            modelClass: path.join(__dirname, 'schoolModules.model'),
            join: {
              from: 'SchoolModuleCategories.sSchoolModuleCategoryId',
              to: 'SchoolModules.sSchoolModuleCategoryId'
            }
        }
    };
}
