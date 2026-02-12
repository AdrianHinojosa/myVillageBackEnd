import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../../Config/Db.config';
import { Page } from 'objection';
import { AdministratorModulesModel, IAdministratorModules } from './administratorModules.model';

class Queries {
    constructor() {

    };
    static async findAllModules() {
        return await AdministratorModulesModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('*').orderBy('sName', 'ASC');
        })
    }
}

export default Queries;