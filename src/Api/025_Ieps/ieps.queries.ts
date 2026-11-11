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

// `date` columns. An empty date input in the browser yields '' rather than null, and
// `Validations.Date` accepts '' on purpose (`.allow('')`) — so '' is a valid request value that
// PostgreSQL cannot store: `invalid input syntax for type date: ""`. Mapping it to null keeps the
// "clear this date" intent, which is what the user means by emptying the field.
// A key that is absent stays absent, so a PATCH never nulls a date the client did not send.
const DATE_FIELDS = ['dtIepStartDate', 'dtIepReviewDate'];

function nullifyEmptyDates(oData: any): any {
    const result = { ...oData };
    for (const field of DATE_FIELDS) {
        if (result[field] === '') {
            result[field] = null;
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
        // Las firmas NO se guardan por esta vía: se capturan con su propio endpoint
        // (`setSignature`). Además, cualquier cambio de contenido del IEP las invalida —deben
        // recapturarse—, así que se descartan del payload de contenido y se limpian al actualizar.
        const { aSignatures, ...oContent } = oData || {};
        const oSafeData = nullifyEmptyDates(stringifyJsonbFields(oContent));

        if (existingIep) {
            // Update existing IEP — se limpian las firmas (invalidación por cambio de contenido).
            return await IepsModel.query().patchAndFetchById(existingIep.sIepId, {
                ...oSafeData,
                aSignatures: JSON.stringify([]),
                sStudentId,
                sLastUpdatedBy: sUserId
            }).where('bActive', true);
        } else {
            // Create new IEP (aSignatures queda en su default '[]')
            return await IepsModel.query().insert({
                ...oSafeData,
                sStudentId,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId,
                bActive: true
            }).returning('*');
        }
    }

    // Lee el arreglo de firmas actual del IEP (jsonb ya parseado por pg → arreglo JS).
    static readSignatures(oIep): any[] {
        const aRaw = oIep && (oIep as any).aSignatures;
        return Array.isArray(aRaw) ? aRaw : [];
    }

    // Guarda/actualiza la firma de un espacio (iSlot 0-7) del IEP activo del alumno, SIN tocar el
    // contenido (no invalida). Devuelve el arreglo de firmas actualizado, o null si no hay IEP.
    static async setSignature(sStudentId, oSignature, sUserId) {
        const existingIep = await Queries.findIepByStudent(sStudentId);
        if (!existingIep) return null;

        const oEntry = {
            iSlot: oSignature.iSlot,
            sRole: oSignature.sRole || '',
            sSignerName: oSignature.sSignerName || '',
            sSignature: oSignature.sSignature,
            tSignedAt: new Date().toISOString(),
        };
        const aNext = Queries.readSignatures(existingIep).filter((s) => s.iSlot !== oSignature.iSlot);
        aNext.push(oEntry);
        aNext.sort((a, b) => (a.iSlot || 0) - (b.iSlot || 0));

        const updated = await IepsModel.query().patchAndFetchById(existingIep.sIepId, {
            aSignatures: JSON.stringify(aNext),
            sLastUpdatedBy: sUserId,
        }).where('bActive', true);
        return Queries.readSignatures(updated);
    }

    // Borra la firma de un espacio. Devuelve el arreglo actualizado, o null si no hay IEP.
    static async deleteSignature(sStudentId, iSlot, sUserId) {
        const existingIep = await Queries.findIepByStudent(sStudentId);
        if (!existingIep) return null;

        const aNext = Queries.readSignatures(existingIep).filter((s) => s.iSlot !== iSlot);
        const updated = await IepsModel.query().patchAndFetchById(existingIep.sIepId, {
            aSignatures: JSON.stringify(aNext),
            sLastUpdatedBy: sUserId,
        }).where('bActive', true);
        return Queries.readSignatures(updated);
    }
}

export default Queries;
