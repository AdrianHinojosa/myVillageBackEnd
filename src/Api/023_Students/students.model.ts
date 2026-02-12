import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { SchoolsModel } from '../022_Schools/schools.model';

Model.knex(db);

export interface IStudents {
    sStudentId?: string;
    sSchoolId?: string;
    sName?: string;
    sLastName?: string;
    sSecondLastName?: string;
    iBirthYear?: number;
    sGrade?: string;
    sGroup?: string;
    sDiagnosis?: string;
    sNotes?: string;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    sLastDeletedBy?: string;
    bActive?: boolean;
}

export class StudentsModel extends Model {
    public sStudentId?: string;
    public sSchoolId?: string;
    public sName?: string;
    public sLastName?: string;
    public sSecondLastName?: string;
    public iBirthYear?: number;
    public sGrade?: string;
    public sGroup?: string;
    public sDiagnosis?: string;
    public sNotes?: string;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public sLastDeletedBy?: string;
    public bActive?: boolean;

    static tableName: string = 'Students';
    static idColumn: string | string[] = 'sStudentId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        School: {
            relation: Model.BelongsToOneRelation,
            modelClass: SchoolsModel,
            join: {
                from: 'Students.sSchoolId',
                to: 'Schools.sSchoolId'
            }
        },
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
