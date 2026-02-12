import { Model, QueryContext, RelationMappings, RelationMappingsThunk } from 'objection';
import { db } from '../../Config/Db.config';
import { StudentsModel } from '../023_Students/students.model';
import { GoalTasksModel } from './001_GoalTasks/goalTasks.model';

Model.knex(db);

export interface IGoals {
    sGoalId?: string;
    sStudentId?: string;
    sTitle?: string;
    sDescription?: string;
    sMeasurementType?: string;
    sStatus?: string;
    tStartDate?: string;
    tTargetDate?: string;
    tCompletedDate?: string;
    iTargetValue?: number;
    iTargetDuration?: number;
    iScaleMin?: number;
    iScaleMax?: number;
    sFrequencyUnit?: string;
    dProgress?: number;
    dAverageValue?: number;
    iRecordsCount?: number;
    tLastRecord?: string;
    sCreatedBy?: string;
    sLastUpdatedBy?: string;
    sLastDeletedBy?: string;
    bActive?: boolean;
}

export class GoalsModel extends Model {
    public sGoalId?: string;
    public sStudentId?: string;
    public sTitle?: string;
    public sDescription?: string;
    public sMeasurementType?: string;
    public sStatus?: string;
    public tStartDate?: string;
    public tTargetDate?: string;
    public tCompletedDate?: string;
    public iTargetValue?: number;
    public iTargetDuration?: number;
    public iScaleMin?: number;
    public iScaleMax?: number;
    public sFrequencyUnit?: string;
    public dProgress?: number;
    public dAverageValue?: number;
    public iRecordsCount?: number;
    public tLastRecord?: string;
    public sCreatedBy?: string;
    public sLastUpdatedBy?: string;
    public sLastDeletedBy?: string;
    public bActive?: boolean;

    static tableName: string = 'Goals';
    static idColumn: string | string[] = 'sGoalId';

    static relationMappings: RelationMappings | RelationMappingsThunk = {
        Student: {
            relation: Model.BelongsToOneRelation,
            modelClass: StudentsModel,
            join: {
                from: 'Goals.sStudentId',
                to: 'Students.sStudentId'
            }
        },

        GoalTask: {
            relation: Model.HasManyRelation,
            modelClass: GoalTasksModel,
            join: {
                from: 'Goals.sGoalId',
                to: 'GoalTasks.sGoalId'
            }
        },
    };

    async $beforeUpdate() {
        this.updated_at = new Date();
    }
}
