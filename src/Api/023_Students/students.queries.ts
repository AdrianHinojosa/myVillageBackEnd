import { StudentsModel, IStudents } from './students.model';
import { db } from '../../Config/Db.config';

class Queries {
    constructor() {
    };

    // Verify student exists
    static async verifyStudentExists(sStudentId) {
        return await StudentsModel.query().findById(sStudentId).select('*').where('bActive', true)
    }

    // Verify student exists and belongs to school
    static async verifyStudentExistsBySchool(sSchoolId, sStudentId) {
        return await StudentsModel.query().findById(sStudentId).select('*').where('sSchoolId', sSchoolId).where('bActive', true)
    }

    // Insert student
    static async insertStudent({sSchoolId, sName, sLastName, sSecondLastName, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes, sCreatedBy}) {
        return await StudentsModel.query().insert({
            sSchoolId,
            sName,
            sLastName,
            sSecondLastName,
            iBirthYear,
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
    static async updateStudent(sStudentId, {sName, sLastName, sSecondLastName, iBirthYear, sGrade, sGroup, sDiagnosis, sNotes, sLastUpdatedBy}) {
        return await StudentsModel.query().patchAndFetchById(sStudentId, {
            sName,
            sLastName,
            sSecondLastName,
            iBirthYear,
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
    static async findAllStudents(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sGrade) {
        return await StudentsModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('Students.*')

            // Computed: full name
            queryBuilder.select(db.raw(`
                TRIM(CONCAT_WS(' ', "Students"."sName", "Students"."sLastName", "Students"."sSecondLastName")) AS "sFullName"
            `))

            // Computed: age from birth year
            queryBuilder.select(db.raw(`
                (EXTRACT(YEAR FROM NOW()) - "Students"."iBirthYear")::integer AS "iAge"
            `))

            // Subquery: count of active goals
            queryBuilder.select(db.raw(`
                (
                    SELECT COUNT(*)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
                ) AS "iGoalsCount"
            `))

            // Subquery: average progress across all active goals (rounded to integer %)
            queryBuilder.select(db.raw(`
                (
                    SELECT COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
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
                ) AS "iGoalsCount"
            `))
            .select(db.raw(`
                (
                    SELECT COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0)::integer
                    FROM "Goals" g
                    WHERE g."sStudentId" = "Students"."sStudentId"
                      AND g."bActive" = true
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
