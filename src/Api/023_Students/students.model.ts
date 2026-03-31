import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { SchoolsModel } from '../022_Schools/schools.model';
import StorageServices from '../../Services/Storage.services';

Model.knex(db);

export interface IStudents {
    sStudentId?: string;
    sSchoolId?: string;
    sName?: string;
    sLastName?: string;
    sSecondLastName?: string;
    sCustomStudentId?: string;
    iBirthYear?: number;
    tBirthDate?: string;
    sGender?: string;
    sGrade?: string;
    sGroup?: string;
    sDiagnosis?: string;
    sNotes?: string;
    sImageKey?: string;
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
    public sCustomStudentId?: string;
    public iBirthYear?: number;
    public tBirthDate?: string;
    public sGender?: string;
    public sGrade?: string;
    public sGroup?: string;
    public sDiagnosis?: string;
    public sNotes?: string;
    public sImageKey?: string;
    public oImages?: any;
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

    async $afterFind() {
        if (this.sImageKey) {
            this.oImages = await StorageServices.GetManyImages(this.sImageKey, ['xs', 'sm', 'md', 'lg', 'xlg']);
        } else {
            this.oImages = null;
        }
    }
}
