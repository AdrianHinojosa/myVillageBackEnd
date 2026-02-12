import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import path from 'path';
import moment from 'moment';

Model.knex(db);

export interface IAdministratorPermissions {
    sAdministratorPermissionId?: string;
    sAdministratorId?: string;
    sAdministratorModuleId?: string;
    sActionCode?: string;
}

export class AdministratorPermissionsModel extends Model {

    public sAdministratorPermissionId?: string;
    public sAdministratorId?: string;
    public sAdministratorModuleId?: string;
    public sActionCode?: string;

    static tableName: string = 'AdministratorPermissions';

    static idColumn: string | string[] = 'sAdministratorPermissionId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        AdministratorModule: {
            relation: Model.BelongsToOneRelation,
            modelClass: path.join(__dirname, 'administrator_modules.model'),
            join: {
                from: 'AdministratorPermissions.sAdministratorModuleId',
                to: 'AdministratorModules.sAdministratorModuleId'
            }
        },
        Administrator: {
            relation: Model.BelongsToOneRelation,
            modelClass: path.join(__dirname, 'administrators.model'),
            join: {
                from: 'AdministratorPermissions.sAdministratorId',
                to: 'Administrator.sAdministratorId'
            }
        }
    };
}

