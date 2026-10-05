import { StudentsModel, IStudents } from './students.model';
import { PersonsModel } from './persons.model';
import { db } from '../../Config/Db.config';

// Normaliza para comparar nombres: sin acentos, minúsculas, espacios colapsados.
const RE_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
function normalizeName(sValue): string {
    return (sValue || '').toString().normalize('NFD').replace(RE_DIACRITICS, '')
        .toLowerCase().replace(/\s+/g, ' ').trim();
}

// Fecha a 'YYYY-MM-DD' para comparar fechas de nacimiento sin corrimiento de zona.
function toYMD(dValue): string {
    if (!dValue) return '';
    const oDate = new Date(dValue);
    if (Number.isNaN(oDate.getTime())) return '';
    return oDate.toISOString().split('T')[0];
}

class Queries {
    constructor() {
    };

    // Verify student exists
    static async verifyStudentExists(sStudentId) {
        return await StudentsModel.query().findById(sStudentId).select('*').where('bActive', true)
    }

    /**
     * Feature 2 — verifica un folio (identidad compartida) contra nombre completo + fecha de
     * nacimiento. Devuelve la Person SOLO si todo coincide; de lo contrario null (no se revela
     * si el folio existe o qué dato falló). El folio es `Persons.sPersonId`.
     */
    static async verifyPersonByFolio(sFolio, sFullName, tBirthDate) {
        const oPerson = await PersonsModel.query().findById(sFolio).where('bActive', true);
        if (!oPerson) return null;

        const sPersonFull = normalizeName(`${oPerson.sName} ${oPerson.sLastName} ${oPerson.sSecondLastName || ''}`);
        if (normalizeName(sFullName) !== sPersonFull) return null;
        if (toYMD(tBirthDate) !== toYMD(oPerson.tBirthDate)) return null;

        return oPerson;
    }

    // Feature 2 — ¿este colegio ya tiene un alumno ligado a esta identidad? (evita duplicados)
    static async findActiveStudentBySchoolAndPerson(sSchoolId, sPersonId) {
        return await StudentsModel.query()
            .where('sSchoolId', sSchoolId).where('sPersonId', sPersonId).where('bActive', true).first();
    }

    /**
     * Feature 2 — alta de alumno con identidad compartida.
     * - Con `sPersonId` (folio existente): reusa la Person; el nombre + fecha se copian de ella
     *   (fuente de verdad de lo compartido). El resto (grado, diagnóstico, etc.) es de este colegio.
     * - Sin `sPersonId` (alumno nuevo): crea una Person nueva a partir del nombre + fecha enviados.
     */
    static async insertStudentWithIdentity({sSchoolId, sPersonId, sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes, sCreatedBy}) {
        return await StudentsModel.transaction(async (trx) => {
            let oPerson;
            if (sPersonId) {
                oPerson = await PersonsModel.query(trx).findById(sPersonId).where('bActive', true);
                if (!oPerson) throw new Error('PERSON_NOT_FOUND');
            } else {
                oPerson = await PersonsModel.query(trx).insert({
                    sName,
                    sLastName,
                    sSecondLastName: sSecondLastName || '',
                    // Guardar como 'YYYY-MM-DD' string: Joi.date() entrega Date UTC-medianoche y pg lo
                    // serializa en hora local (México UTC-6) → guardaría un día antes y rompería el
                    // match por folio. toYMD normaliza tanto Date como string.
                    tBirthDate: tBirthDate ? toYMD(tBirthDate) : null,
                    bActive: true
                }).returning('*');
            }

            const newStudent = await StudentsModel.query(trx).insert({
                sSchoolId,
                sPersonId: oPerson.sPersonId,
                // Identidad compartida: SIEMPRE se copia desde la Person.
                sName: oPerson.sName,
                sLastName: oPerson.sLastName,
                sSecondLastName: oPerson.sSecondLastName,
                tBirthDate: oPerson.tBirthDate,
                // Lo demás es por institución.
                sCustomStudentId,
                iBirthYear,
                sGender,
                sGrade,
                sGroup,
                sDiagnosis,
                sNotes,
                sCreatedBy,
                sLastUpdatedBy: sCreatedBy,
                bActive: true
            }).returning('*');

            return newStudent;
        });
    }

    // Verify student exists and belongs to school
    static async verifyStudentExistsBySchool(sSchoolId, sStudentId) {
        return await StudentsModel.query().findById(sStudentId).select('*').where('sSchoolId', sSchoolId).where('bActive', true)
    }

    // Insert student
    static async insertStudent({sSchoolId, sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes, sCreatedBy}) {
        return await StudentsModel.query().insert({
            sSchoolId,
            sName,
            sLastName,
            sSecondLastName,
            sCustomStudentId,
            iBirthYear,
            tBirthDate,
            sGender,
            sGrade,
            sGroup,
            sDiagnosis,
            sNotes,
            sCreatedBy,
            sLastUpdatedBy: sCreatedBy,
            bActive: true
        }).returning('*');
    }

    // Update student
    static async updateStudent(sStudentId, {sName, sLastName, sSecondLastName, sCustomStudentId, iBirthYear, tBirthDate, sGender, sGrade, sGroup, sDiagnosis, sNotes, sLastUpdatedBy}) {
        return await StudentsModel.query().patchAndFetchById(sStudentId, {
            sName,
            sLastName,
            sSecondLastName,
            sCustomStudentId,
            iBirthYear,
            tBirthDate,
            sGender,
            sGrade,
            sGroup,
            sDiagnosis,
            sNotes,
            sLastUpdatedBy
        }).where('bActive', true);
    }

    /**
     * @param sSchoolId
     * @param iPageNumber
     * @param iItemsPerPage
     * @param sSearch (general search by name, last name)
     * @param sGrade (optional filter by grade)
     * @returns
     */
    static async findAllStudents(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sGrade, aAssignedStudentIds?: string[]) {
        return await StudentsModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('Students.*')

            // Computed: full name
            queryBuilder.select(db.raw(`
                TRIM(CONCAT_WS(' ', "Students"."sName", "Students"."sLastName", "Students"."sSecondLastName")) AS "sFullName"
            `))

            // Computed: age from tBirthDate (preferred) or iBirthYear (fallback)
            queryBuilder.select(db.raw(`
                CASE
                    WHEN "Students"."tBirthDate" IS NOT NULL THEN EXTRACT(YEAR FROM AGE(NOW(), "Students"."tBirthDate"))::integer
                    WHEN "Students"."iBirthYear" IS NOT NULL THEN (EXTRACT(YEAR FROM NOW()) - "Students"."iBirthYear")::integer
                    ELSE NULL
                END AS "iAge"
            `))

            // Subquery: count of active goals
            queryBuilder.select(db.raw(`
                (
                    SELECT COUNT(*)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
                      AND g."sParentGoalId" IS NULL   -- P7: subgoals are Goals rows; never count them as goals
                ) AS "iGoalsCount"
            `))

            // Subquery: average progress across all active goals (rounded to integer %)
            queryBuilder.select(db.raw(`
                (
                    SELECT COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
                      AND g."sParentGoalId" IS NULL   -- P7: exclude subgoals from the average
                ) AS "dGoalsProgress"
            `))

            queryBuilder.where('Students.sSchoolId', sSchoolId)
            queryBuilder.where('Students.bActive', true)

            if (sSearch) {
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("Students"."sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Students"."sLastName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Students"."sSecondLastName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }

            if (sGrade) {
                queryBuilder.where('Students.sGrade', sGrade)
            }

            // FACULTY filtering: only show assigned students
            if (aAssignedStudentIds !== null && aAssignedStudentIds !== undefined) {
                queryBuilder.whereIn('Students.sStudentId', aAssignedStudentIds)
            }
        }).orderBy('Students.updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
    }

    // Get ONE Student
    static async findOneStudent(sSchoolId, sStudentId) {
        return await StudentsModel.query().findById(sStudentId)
            .select('Students.*')
            .select(db.raw(`
                TRIM(CONCAT_WS(' ', "Students"."sName", "Students"."sLastName", "Students"."sSecondLastName")) AS "sFullName"
            `))
            .select(db.raw(`
                (EXTRACT(YEAR FROM NOW()) - "Students"."iBirthYear")::integer AS "iAge"
            `))
            .select(db.raw(`
                (
                    SELECT COUNT(*)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
                      AND g."sParentGoalId" IS NULL   -- P7: subgoals are Goals rows; never count them as goals
                ) AS "iGoalsCount"
            `))
            .select(db.raw(`
                (
                    SELECT COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
                      AND g."sParentGoalId" IS NULL   -- P7: exclude subgoals from the average
                ) AS "dGoalsProgress"
            `))
            .where('Students.sSchoolId', sSchoolId)
            .where('Students.bActive', true)
    }

    // Soft delete student
    static async deleteStudent(sStudentId, sLastDeletedBy) {
        return await StudentsModel.query().patchAndFetchById(sStudentId, {
            bActive: false,
            sLastDeletedBy: sLastDeletedBy
        }).where('bActive', true);
    }

    // Update student image key
    static async updateStudentImage(sStudentId: string, sImageKey: string) {
        return await StudentsModel.query().patchAndFetchById(sStudentId, {
            sImageKey: sImageKey
        }).where('bActive', true);
    }

    // Count active students by school
    static async findCountOfActiveStudentsBySchool(sSchoolId) {
        const query = StudentsModel.query()
            .count('sStudentId as count')
            .where('sSchoolId', sSchoolId)
            .where('bActive', true)
        const result = await query.first();
        return parseInt(result?.count ?? '0');
    }
}

export default Queries;
