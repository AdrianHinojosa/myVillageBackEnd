import { IepsModel } from './ieps.model';

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

        if (existingIep) {
            // Update existing IEP
            return await IepsModel.query().patchAndFetchById(existingIep.sIepId, {
                ...oData,
                sStudentId,
                sLastUpdatedBy: sUserId
            }).where('bActive', true);
        } else {
            // Create new IEP
            return await IepsModel.query().insert({
                ...oData,
                sStudentId,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId,
                bActive: true
            }).returning('*');
        }
    }
}

export default Queries;
