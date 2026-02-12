import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../../Config/Db.config';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface IAdministratorModules {
    sAdministratorModuleId?: string;
    sName?: string;
    
}

export class AdministratorModulesModel extends Model {

    public sAdministratorModuleId?: string;
    public sName?: string;

    static tableName: string = 'AdministratorModules';

    static idColumn: string | string[] = 'sAdministratorModuleId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        AdministratorPermissions: {
            relation: Model.ManyToManyRelation,
            modelClass: path.join(__dirname, 'administrators.model'),
            join: {
              from: 'AdministratorModules.sAdministratorModuleId',
              through: {
                // persons_movies is the join table.
                from: 'AdministratorPermissions.sAdministratorModuleId',
                to: 'AdministratorPermissions.sAdministratorId'
              },
              to: 'Administrators.sAdministratorId'
            }
          }
    };
}

