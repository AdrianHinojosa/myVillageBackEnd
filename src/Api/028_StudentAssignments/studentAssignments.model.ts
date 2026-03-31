import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { StudentsModel } from '../023_Students/students.model';
import { SchoolUsersModel } from '../022_Schools/001_SchoolUsers/schoolUsers.model';

Model.knex(db);

export interface IStudentAssignment {
    sStudentAssignmentId?: string;
    sStudentId?: string;
    sSchoolUserId?: string;
    created_at?: Date;
}

export class StudentAssignmentsModel extends Model {
    public sStudentAssignmentId?: string;
    public sStudentId?: string;
    public sSchoolUserId?: string;
    public created_at?: Date;

    static tableName: string = 'StudentAssignments';
    static idColumn: string | string[] = 'sStudentAssignmentId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Student: {
            relation: Model.BelongsToOneRelation,
            modelClass: StudentsModel,
            join: {
                from: 'StudentAssignments.sStudentId',
                to: 'Students.sStudentId'
            }
        },
        SchoolUser: {
            relation: Model.BelongsToOneRelation,
            modelClass: SchoolUsersModel,
            join: {
                from: 'StudentAssignments.sSchoolUserId',
                to: 'SchoolUsers.sSchoolUserId'
            }
        }
    };
}
