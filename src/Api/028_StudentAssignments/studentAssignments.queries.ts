import { StudentAssignmentsModel } from './studentAssignments.model';
import { db } from '../../Config/Db.config';

class Queries {
    constructor() {};

    // Insert a new assignment
    static async insertAssignment(sStudentId: string, sSchoolUserId: string) {
        return await StudentAssignmentsModel.query().insert({
            sStudentId,
            sSchoolUserId
        }).returning('*');
    }

    // Check if assignment already exists
    static async findExistingAssignment(sStudentId: string, sSchoolUserId: string) {
        return await StudentAssignmentsModel.query()
            .where('sStudentId', sStudentId)
            .where('sSchoolUserId', sSchoolUserId)
            .first();
    }

    // Find assignment by ID
    static async findAssignmentById(sStudentAssignmentId: string) {
        return await StudentAssignmentsModel.query().findById(sStudentAssignmentId);
    }

    // Delete an assignment
    static async deleteAssignment(sStudentAssignmentId: string) {
        return await StudentAssignmentsModel.query().deleteById(sStudentAssignmentId);
    }

    // Find all assignments for a student (with teacher info)
    static async findAssignmentsByStudent(sStudentId: string) {
        return await db.raw(`
            SELECT
                sa."sStudentAssignmentId",
                sa."sStudentId",
                sa."sSchoolUserId",
                TRIM(CONCAT_WS(' ', u."sName", u."sLastName", u."sSecondLastName")) AS "sFullName",
                u."sName",
                u."sLastName",
                u."sEmail"
            FROM "StudentAssignments" sa
            JOIN "Users" u ON u."sUserId" = sa."sSchoolUserId" AND u."bActive" = true
            WHERE sa."sStudentId" = ?
            ORDER BY u."sName" ASC
        `, [sStudentId]);
    }

    // Get student IDs assigned to a specific school user
    static async findAssignedStudentIds(sSchoolUserId: string): Promise<string[]> {
        const results = await StudentAssignmentsModel.query()
            .select('sStudentId')
            .where('sSchoolUserId', sSchoolUserId);
        return results.map((r: any) => r.sStudentId);
    }
}

export default Queries;
