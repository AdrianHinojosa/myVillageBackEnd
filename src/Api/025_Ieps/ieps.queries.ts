import { IepsModel } from './ieps.model';

// JSONB fields that need explicit JSON.stringify for PostgreSQL
const JSONB_FIELDS = ['aExternalServices', 'aFocusAreas', 'aAccommodations', 'aModifications', 'aObjectives', 'aTeamMembers'];

function stringifyJsonbFields(oData: any): any {
    const result = { ...oData };
    for (const field of JSONB_FIELDS) {
        if (result[field] !== undefined && result[field] !== null && typeof result[field] !== 'string') {
            result[field] = JSON.stringify(result[field]);
        }
    }
    return result;
}

class Queries {
    constructor() {};

    // Find active IEP for a student
    static async findIepByStudent(sStudentId) {
        return await IepsModel.query()
            .where('sStudentId', sStudentId)
            .where('bActive', true)
            .whereNull('tDeletedAt')
            .first();
    }

    // Upsert IEP (create or update)
    static async upsertIep(sStudentId, oData, sUserId) {
        const existingIep = await Queries.findIepByStudent(sStudentId);
        const oSafeData = stringifyJsonbFields(oData);

        if (existingIep) {
            // Update existing IEP
            return await IepsModel.query().patchAndFetchById(existingIep.sIepId, {
                ...oSafeData,
                sStudentId,
                sLastUpdatedBy: sUserId
            }).where('bActive', true);
        } else {
            // Create new IEP
            return await IepsModel.query().insert({
                ...oSafeData,
                sStudentId,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId,
                bActive: true
            }).returning('*');
        }
    }
}

export default Queries;
