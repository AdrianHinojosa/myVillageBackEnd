import { Model, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { StudentsModel } from '../023_Students/students.model';

Model.knex(db);

export interface IIep {
    sIepId?: string;
    sStudentId?: string;
    sStatus?: string;
    aExternalServices?: any;
    sParentNames?: string;
    sParentConcerns?: string;
    sSchoolAssignment?: string;
    sSchoolAssignmentOther?: string;
    sStrengths?: string;
    sAreasOfOpportunity?: string;
    sCognitiveEvaluations?: string;
    sSubjectGrades?: string;
    sEvaluationResults?: string;
    sCommunicationComments?: string;
    sMotorComments?: string;
    sSocioemotionalComments?: string;
    sIndependenceComments?: string;
    aFocusAreas?: any;
    sFocusAreasSubjects?: string;
    aAccommodations?: any;
    sOtherAccommodations?: string;
    bRequiresModifications?: boolean;
    aModifications?: any;
    aObjectives?: any;
    dtIepStartDate?: string;
    dtIepReviewDate?: string;
    sNotes?: string;
    aTeamMembers?: any;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    bActive?: boolean;
    tDeletedAt?: string;
}

export class IepsModel extends Model {
    public sIepId?: string;
    public sStudentId?: string;
    public sStatus?: string;
    public aExternalServices?: any;
    public sParentNames?: string;
    public sParentConcerns?: string;
    public sSchoolAssignment?: string;
    public sSchoolAssignmentOther?: string;
    public sStrengths?: string;
    public sAreasOfOpportunity?: string;
    public sCognitiveEvaluations?: string;
    public sSubjectGrades?: string;
    public sEvaluationResults?: string;
    public sCommunicationComments?: string;
    public sMotorComments?: string;
    public sSocioemotionalComments?: string;
    public sIndependenceComments?: string;
    public aFocusAreas?: any;
    public sFocusAreasSubjects?: string;
    public aAccommodations?: any;
    public sOtherAccommodations?: string;
    public bRequiresModifications?: boolean;
    public aModifications?: any;
    public aObjectives?: any;
    public dtIepStartDate?: string;
    public dtIepReviewDate?: string;
    public sNotes?: string;
    public aTeamMembers?: any;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public bActive?: boolean;
    public tDeletedAt?: string;
    public created_at?: Date;
    public updated_at?: Date;

    static tableName: string = 'IEPs';
    static idColumn: string | string[] = 'sIepId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Student: {
            relation: Model.BelongsToOneRelation,
            modelClass: StudentsModel,
            join: {
                from: 'IEPs.sStudentId',
                to: 'Students.sStudentId'
            }
        }
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
