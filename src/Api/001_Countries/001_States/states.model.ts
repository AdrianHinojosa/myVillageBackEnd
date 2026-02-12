import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import { CountriesModel } from '../countries.model';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface IStates {
    sStateId?: string;
    sName?: string;
    sCode?: number;
    sCountryId?: string;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class StatesModel extends Model {
    public sStateId?: string;
    public sName?: string;
    public sCode?: string;
    public sCountryId?: string;
    public bActive?: boolean;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'States';
    static idColumn: string | string[] = 'sStateId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Country: {
            relation: Model.BelongsToOneRelation,
            modelClass:  path.join(__dirname, '../countries.model'),
            join: {
                from: 'States.sCountryId',
                to: 'Countries.sCountryId'
            }
        }
    };
}

