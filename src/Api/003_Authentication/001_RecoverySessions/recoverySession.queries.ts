import { RecoverySessionsModel } from "./recoverySessions.model";

class Queries {
    constructor() { }

    // Used. Create Recovery token or initial token.
    async insertTokenByUserId(sToken: string, sUserId: string, tExpiresAt: Date): Promise<any> {
        return RecoverySessionsModel.query().insert({
            sUserId: sUserId,
            sToken: sToken,
            tExpiresAt: tExpiresAt
        }).returning('*')
    }

    // Used to verify a token.
    async verifyRecoveryToken(sTokenId): Promise<any> {
        return RecoverySessionsModel.query().select('*').where('sToken', sTokenId).andWhere('bActive', true).first();
    }

    async deleteAllTokensByUserId(sUserId: string): Promise<number> {
        return RecoverySessionsModel.query().patch({
            bActive: false
        })
        .where('sUserId', sUserId)
        .andWhere('bActive', true)
    }
}

export default new Queries();