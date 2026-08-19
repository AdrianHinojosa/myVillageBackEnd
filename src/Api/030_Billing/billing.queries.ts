import { PaymentsModel } from './billing.model';
import { SchoolsModel } from '../022_Schools/schools.model';

/**
 * Punto 3 — database access for billing. No Stripe calls live here; those are in the controllers
 * and the webhook handler, so this file stays testable without credentials.
 */
class Queries {
    constructor() {};

    /** The school row, with every billing column. */
    static async findSchoolBilling(sSchoolId) {
        return await SchoolsModel.query().findById(sSchoolId).where('bActive', true);
    }

    /** Look a school up by its Stripe customer id — the way webhooks arrive. Indexed. */
    static async findSchoolByStripeCustomer(sStripeCustomerId) {
        return await SchoolsModel.query()
            .where('sStripeCustomerId', sStripeCustomerId)
            .where('bActive', true)
            .first();
    }

    /** Look a school up by its Stripe subscription id. Indexed. */
    static async findSchoolByStripeSubscription(sStripeSubscriptionId) {
        return await SchoolsModel.query()
            .where('sStripeSubscriptionId', sStripeSubscriptionId)
            .where('bActive', true)
            .first();
    }

    /** Patch billing columns only. Never touches anything else on the school. */
    static async patchSchoolBilling(sSchoolId, oPatch: any) {
        return await SchoolsModel.query()
            .patchAndFetchById(sSchoolId, oPatch)
            .where('bActive', true);
    }

    /**
     * Is this user the school's MAIN user?
     *
     * The contract restricts card management and cancellation to the "usuario principal del
     * colegio". The only marker in the schema is `Users.sCreatedBy IS NULL` — the account created
     * with the school itself, as opposed to users that account later created.
     */
    static async isMainSchoolUser(sSchoolId, sUserId): Promise<boolean> {
        const oRow: any = await SchoolsModel.knex()
            .select('u.sUserId')
            .from('Users as u')
            .join('SchoolUsers as su', 'su.sSchoolUserId', 'u.sUserId')
            .where('su.sSchoolId', sSchoolId)
            .where('u.sUserId', sUserId)
            .whereNull('u.sCreatedBy')
            .where('u.bActive', true)
            .first();
        return !!oRow;
    }

    /** The school's main user — used as the recipient of dunning email. */
    static async findMainSchoolUser(sSchoolId) {
        return await SchoolsModel.knex()
            .select('u.sUserId', 'u.sName', 'u.sLastName', 'u.sEmail')
            .from('Users as u')
            .join('SchoolUsers as su', 'su.sSchoolUserId', 'u.sUserId')
            .where('su.sSchoolId', sSchoolId)
            .whereNull('u.sCreatedBy')
            .where('u.bActive', true)
            .first();
    }

    /** Payment history, newest first. */
    static async findPaymentsBySchool(sSchoolId, iPageNumber = 1, iItemsPerPage = 50) {
        return await PaymentsModel.query()
            .where('sSchoolId', sSchoolId)
            .orderBy('tPaidAt', 'desc')
            .orderBy('created_at', 'desc')
            .page((Number(iPageNumber) - 1), Number(iItemsPerPage));
    }

    /**
     * Record a charge attempt, idempotently.
     *
     * Stripe explicitly may deliver the same event more than once, so this upserts on the unique
     * `sStripeTransactionId` instead of inserting blindly — otherwise a redelivery would show the
     * school a duplicate payment. When there is no transaction id to key on (a failed attempt that
     * never produced a charge) it falls back to the invoice id.
     */
    static async recordPayment(oData: any) {
        if (oData.sStripeTransactionId) {
            const oExisting = await PaymentsModel.query()
                .where('sStripeTransactionId', oData.sStripeTransactionId)
                .first();
            if (oExisting) {
                return await PaymentsModel.query()
                    .patchAndFetchById(oExisting.sPaymentId, oData);
            }
        } else if (oData.sStripeInvoiceId) {
            const oExisting = await PaymentsModel.query()
                .where('sStripeInvoiceId', oData.sStripeInvoiceId)
                .where('sStatus', oData.sStatus)
                .first();
            if (oExisting) {
                return await PaymentsModel.query()
                    .patchAndFetchById(oExisting.sPaymentId, oData);
            }
        }
        return await PaymentsModel.query().insert(oData).returning('*');
    }
}

export default Queries;
