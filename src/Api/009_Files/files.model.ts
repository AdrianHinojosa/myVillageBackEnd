import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { UsersModel } from '../004_Users/users.model';
import path from 'path';
import moment from 'moment';
import Storage from '../../Services/Storage.services'

import * as MomentServices from '../../Services/Moment.services';


Model.knex(db);

export interface IFile {
    sFileId?: string;
    sFolio?: string;
    sFileName?: string;
    sFileKey?: string;
    sFileType?: string;

    // See who has edited
    sCreatedBy?: string;
    sLastUpdatedBy?: string;

    // Check if active:
    bActive?: boolean;
    
    created_at?: Date;
    updated_at?: Date;
    formattedCreatedAt?: string;
    formattedUpdatedAt?: string

}

export class FilesModel extends Model {
    public sFileId?: string;
    public sFolio?: string;
    public sFileName?: string;
    public sFileKey?: string;
    public sFileType?: string;
    public sFileUrl?: string;

    // See who has edited
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;

    // Check if active:
    public bActive?: boolean;

    public created_at?: Date;
    public updated_at?: Date;

    public formattedCreatedAt?: string;
    public formattedUpdatedAt?: string

    static tableName: string = 'Files';
    static idColumn: string | string[] = 'sFileId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        CreatedByUser: {
            relation: Model.HasOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'Files.sCreatedBy',
                to: 'Users.sUserId'
            }
        },

        LastUpdatedByUser: {
            relation: Model.HasOneRelation,
            modelClass: UsersModel,
            join: {
                from: 'Files.sLastUpdatedBy',
                to: 'Users.sUserId'
            }
        },
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }

        
    async $afterFind() {
        // Flag get Image
        if (this.sFileKey) {
            this.sFileUrl = await Storage.getFile(this.sFileKey);
        }

        if (this.created_at) {
            this.formattedCreatedAt = MomentServices.FormatDateUTCSix(this.created_at);
          }
          if (this.updated_at) {
            this.formattedUpdatedAt = MomentServices.FormatDateUTCSix(this.updated_at);
          }
    }


}

