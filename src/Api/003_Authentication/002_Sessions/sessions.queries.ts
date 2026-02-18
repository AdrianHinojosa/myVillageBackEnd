import { SessionsModel } from './sessions.model';
import {SelectJsonData, RawQuery, RawQueryInArray, db} from '../../../Config/Db.config';

class Queries {
    constructor() {};

    // Used: For login create Session
    static async insertSession({ sUserId, tExpiresAt } ): Promise<any> {
        return await SessionsModel.query().insert({
            sUserId: sUserId,
            tExpiresAt: tExpiresAt
        });
    }

    // Used: For permissions middleware: find user by sessionId validating that a session exists and the user associated exists.
    static async getWithUserById(sSessionId) {
        const session = await SessionsModel.query().findById(sSessionId).withGraphFetched('User')
            .modifyGraph('User', (builder) => {
                builder.where('bActive', true);
            })
            .where('Sessions.bActive', true)
        
        return session;
        }
    
    
    // Used: For permissions middleware: Find by sessionId where the session is active, has not expired and the user within the session is active.
    static async verifyActiveSession(sSessionId) {
        const session = await SessionsModel.query().modify(function (queryBuilder) {
            queryBuilder.select('Sessions.*')
            queryBuilder.innerJoin('Users', 'Users.sUserId', '=', 'Sessions.sUserId')
            queryBuilder.where('Sessions.sSessionId', '=', sSessionId);
            queryBuilder.where('Sessions.bActive', '=', true);
            queryBuilder.where('Users.bActive', '=', true);
            // Verify that the session has not expired
            queryBuilder.where('Sessions.tExpiresAt', '>=', db.raw(`NOW()::TIMESTAMP;`));
            queryBuilder.first()
        } )

        return session;
    }

    // Used: For permissions middleware: Find by sessionId where the session is active, has not expired and the user within the session is active AND an ADMIN.
    static async verifyActiveSessionAdmin(sSessionId: string) : Promise<any> {
        return await SessionsModel.query()
            .select('Sessions.*', 'Administrators.*', 'Users.sCreatedBy', 'Users.sUserId')
            .innerJoin('Users', 'Users.sUserId', '=', 'Sessions.sUserId')
            .innerJoin('Administrators', 'Administrators.sAdministratorId', '=', 'Users.sUserId')
            .where('Sessions.sSessionId', '=', sSessionId)
            .andWhere('Sessions.bActive', '=', true)
            .andWhere('Users.bActive', '=', true)
            .andWhere('Users.bPlatformAccess', '=', true)
            .where('Sessions.tExpiresAt', '>=', db.raw(`NOW()::TIMESTAMP;`))
            .first();
    }

    // Used: Remove session logically
    static async deleteSession(sSessionId) {
        return await SessionsModel.query().patchAndFetchById(sSessionId, {
            bActive: false
        }).where('bActive', true)
    }

    // Used: Refresh Token by Adding 4 hours to the time.
    static async updateTokenExpiration(sSessionId) {
        return await SessionsModel.query().patchAndFetchById(sSessionId, {
            tExpiresAt: SessionsModel.raw(`NOW()::TIMESTAMP + INTERVAL '4 hours'`)
        }).where('bActive', true)
    }

    // Used: Refresh Token by Adding 120 hours to the time.
    static async updateTokenExpirationEnterprises(sSessionId) {
        return await SessionsModel.query().patchAndFetchById(sSessionId, {
            tExpiresAt: SessionsModel.raw(`NOW()::TIMESTAMP + INTERVAL '120 hours'`)
        }).where('bActive', true)
    }

    // Used: Delete all sessions from a specific user ID.
    static async deleteAllSessionsByUserId(sUserId: string): Promise<number> {
        return SessionsModel.query().patch({
            bActive: false
        })
        .where('sUserId', sUserId)
        .andWhere('bActive', true)
    }


    // Used: For permissions middleware: Find by sessionId where the session is active, has not expired and the user within the session is active AND a EnterpriseUser.
    static async verifyActiveSessionEnterpriseUser(sSessionId: string) : Promise<any> {
        return await SessionsModel.query()
            .select('Sessions.*', 'EnterpriseUsers.*', 'Users.*')
            .innerJoin('Users', 'Users.sUserId', '=', 'Sessions.sUserId')
            .innerJoin('EnterpriseUsers', 'EnterpriseUsers.sEnterpriseUserId', '=', 'Users.sUserId')
            .where('Sessions.sSessionId', '=', sSessionId)
            .andWhere('Sessions.bActive', '=', true)
            .andWhere('Users.bActive', '=', true)
            .andWhere('Users.bPlatformAccess', '=', true)
            .where('Sessions.tExpiresAt', '>=', db.raw(`NOW()::TIMESTAMP;`))
            .first();
    }

    // Used: Refresh Token by Adding 120 hours to the time for Schools.
    static async updateTokenExpirationSchools(sSessionId) {
        return await SessionsModel.query().patchAndFetchById(sSessionId, {
            tExpiresAt: SessionsModel.raw(`NOW()::TIMESTAMP + INTERVAL '120 hours'`)
        }).where('bActive', true)
    }

    // Used: For permissions middleware: Find by sessionId where the session is active, has not expired and the user within the session is active AND a SchoolUser.
    static async verifyActiveSessionSchoolUser(sSessionId: string) : Promise<any> {
        return await SessionsModel.query()
            .select('Sessions.*', 'SchoolUsers.*', 'Users.*')
            .innerJoin('Users', 'Users.sUserId', '=', 'Sessions.sUserId')
            .innerJoin('SchoolUsers', 'SchoolUsers.sSchoolUserId', '=', 'Users.sUserId')
            .where('Sessions.sSessionId', '=', sSessionId)
            .andWhere('Sessions.bActive', '=', true)
            .andWhere('Users.bActive', '=', true)
            .andWhere('Users.bPlatformAccess', '=', true)
            .where('Sessions.tExpiresAt', '>=', db.raw(`NOW()::TIMESTAMP;`))
            .first();
    }

}

export default Queries;