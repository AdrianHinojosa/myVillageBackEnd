import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../Config/Db.config';
import { Page } from 'objection';
import { UsersModel, IUsers } from "./users.model"

class Queries {
    constructor() {};

    // Used: get user by email for login.
    static async getUserByEmail(email) {
        return await UsersModel.query().select('*').where('sEmail', email).andWhere('bActive', true).context({ keepPassword: true }).first();
    }

    // Used: validate email exists and is in use by ANOTHER user in the platform.
    static async validateEmailExists(sUserId, sEmail) {
        return await UsersModel.query().select('*').where('sEmail', sEmail).andWhere('bActive', true).andWhereNot('sUserId', sUserId).first();
    }

    // Used: Insert an admin.
     static async insertAdmin({sEmail, sPassword, sName, sLastName }) {
        return await UsersModel.query().insert({
            sEmail: sEmail,
            sPassword: sPassword,
            sName: sName,
            sLastName
        }).returning('sEmail');
    }

    // Used: Patch a user password if a reset is valid.
    static async patchPasswordByUserId({sUserId, sPassword}) : Promise<Number> {
        return UsersModel.query().patch({
            sPassword: sPassword,
            bPlatformAccess: UsersModel.raw('CASE WHEN "sPassword" IS NULL THEN true ELSE "bPlatformAccess" END'),
            bVerified: UsersModel.raw('CASE WHEN "sPassword" IS NULL THEN true ELSE "bVerified" END')
        })
        .where('sUserId', sUserId)
        .andWhere('bActive', true);
    }

    // Used: Patch a user bVerified to true once the email has been verified.
    static async patchUserVerification({sUserId}) : Promise<Number> {
        return UsersModel.query().patch({
            bVerified: true
        })
        .where('sUserId', sUserId)
        .andWhere('bActive', true);
    }

    // Used: Get user name by user id for notifications
    static async getUserNameById(sUserId) {
        return await UsersModel.query()
            .findById(sUserId)
            .select('sName', 'sLastName')
            .where('bActive', true)
            .first();
    }
}

export default Queries;