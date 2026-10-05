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
    sEmail?: string;
    sImageKey?: string;
    sPhone?: string;
    sAddress?: string;
    sCityId?: string;
    iUsersLimit?: number;
    iStudentsLimit?: number;
    bBlocked?: boolean;
    sAccountType?: string;
    sBillingMode?: string;
    dFixedAmount?: number;
    dAmountPerTeacher?: number;
    dAmountPerStudent?: number;
    dDiscountPct?: number;
    sBillingStatus?: string;
    sStripeCustomerId?: string;
    sStripeSubscriptionId?: string;
    sStripePriceId?: string;
    tCurrentPeriodEnd?: string;
    bCancelAtPeriodEnd?: boolean;
    iFailedAttempts?: number;
    // Pago por transferencia (billing manual)
    sPaymentMethod?: string;
    dMonthlyAmount?: number;
    tNextPaymentDate?: string;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    sLastDeletedBy?: string;
    bActive?: boolean;
}

export class SchoolsModel extends Model {
    public sSchoolId?: string;
    public sName?: string;
    public sEmail?: string;
    public sImageKey?: string;
    public sPhone?: string;
    public sAddress?: string;
    public sCityId?: string;
    public iUsersLimit?: number;
    public iStudentsLimit?: number;
    public bBlocked?: boolean;
    public sAccountType?: string;
    public sBillingMode?: string;
    public dFixedAmount?: number;
    public dAmountPerTeacher?: number;
    public dAmountPerStudent?: number;
    public dDiscountPct?: number;
    public sBillingStatus?: string;
    public sStripeCustomerId?: string;
    public sStripeSubscriptionId?: string;
    public sStripePriceId?: string;
    public tCurrentPeriodEnd?: string;
    public bCancelAtPeriodEnd?: boolean;
    public iFailedAttempts?: number;
    // Pago por transferencia (billing manual)
    public sPaymentMethod?: string;
    public dMonthlyAmount?: number;
    public tNextPaymentDate?: string;
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
