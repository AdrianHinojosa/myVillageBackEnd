import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { CountriesModel } from '../001_Countries/countries.model';
import { StatesModel } from '../001_Countries/001_States/states.model';

import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface ICities {
    sCityId?: string;
    sName?: string;
    sCode?: number;
    sStateId?: string;
    bActive?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export class CitiesModel extends Model {
    public sCityId?: string;
    public sName?: string;
    public sCode?: string;
    public sStateId?: string;
    public bActive?: boolean;
    public created_at?: Date;
    public updated_at?: Date;
    
    static tableName: string = 'Cities';
    static idColumn: string | string[] = 'sCityId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        State: {
            relation: Model.BelongsToOneRelation,
            modelClass: StatesModel,
            join: {
                from: 'Cities.sStateId',
                to: 'States.sStateId'
            }
        }
    };
}

