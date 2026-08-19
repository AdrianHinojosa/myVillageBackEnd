import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { SchoolsModel } from '../022_Schools/schools.model';

Model.knex(db);

/**
 * Punto 3 — one row per charge attempt, written by the Stripe webhooks only.
 *
 * `sStatus` is lowercase ('succeeded' | 'failed' | 'pending') to match both Stripe's own values and
 * the frontend's `IPayment` type in app/utils/billing.ts.
 */
export interface IPayment {
    sPaymentId?: string;
    sSchoolId?: string;
    dAmount?: number;
    sCurrency?: string;
    tPaidAt?: string;
    sStatus?: string;
    sCardBrand?: string;
    sLast4?: string;
    sStripeTransactionId?: string;
    sStripeInvoiceId?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class PaymentsModel extends Model {
    public sPaymentId?: string;
    public sSchoolId?: string;
    public dAmount?: number;
    public sCurrency?: string;
    public tPaidAt?: string;
    public sStatus?: string;
    public sCardBrand?: string;
    public sLast4?: string;
    public sStripeTransactionId?: string;
    public sStripeInvoiceId?: string;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'Payments';
    static idColumn: string | string[] = 'sPaymentId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        School: {
            relation: Model.BelongsToOneRelation,
            modelClass: SchoolsModel,
            join: {
                from: 'Payments.sSchoolId',
                to: 'Schools.sSchoolId'
            }
        }
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
