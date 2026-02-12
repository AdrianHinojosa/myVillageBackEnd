import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import path from 'path';
import { StatesModel } from './001_States/states.model';
import moment from 'moment';

Model.knex(db);

export interface ICountries {
    sCountryId?: string;
    sName?: string;
    sCode?: string;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class CountriesModel extends Model {
    public sCountryId?: string;
    public sName?: string;
    public sCode?: string;
    public bActive?: boolean;
    public created_at?: Date;
    public updated_at?: Date;
    static tableName: string = 'Countries';
    static idColumn: string | string[] = 'sCountryId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        States: {
            relation: Model.HasManyRelation,
            modelClass: StatesModel,
            join: {
                from: 'Countries.sCountryId',
                to: 'States.sStateId'
            }
        }
    };
}

