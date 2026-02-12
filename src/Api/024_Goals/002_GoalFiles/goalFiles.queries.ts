import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../../Config/Db.config'
import { Page, ref } from 'objection';
import { UsersModel, IUsers } from "../../004_Users/users.model"
import { GoalFilesModel, IGoalFile } from './goalFiles.model';
import { FilesModel, IFile } from '../../009_Files/files.model';


class Queries {
    constructor() {
    };

    // VERIFY exists
     static async verifyGoalFileExistsByGoal(sGoalFileId, sGoalId) {
        return await GoalFilesModel.query().modify(function (queryBuilder : any) {
            queryBuilder
                .findById(sGoalFileId)
                .where('sGoalId', sGoalId)
                .joinRelated('File')
                .where('File.bActive', true)
        })
    }

   // Used: Insert goal files.
   static async insertGoalFiles(arrFilesObject) {
        return await GoalFilesModel.transaction(async (trx) => {
            // Insert into Files table
            const newFiles = await GoalFilesModel.query(trx).insertGraph(arrFilesObject).returning('*')

            return newFiles;
        });
    }

    // Get ALL GoalFiles.
    /**
     * @param sGoalId
     * @param sSearch (general search by name, file type)
     * @returns
     */
    static async findAllGoalFilesByGoal(sGoalId, sSearch) {
        return await GoalFilesModel.query() .modify(function (queryBuilder : any) {
            queryBuilder.where('sGoalId', sGoalId)
            .joinRelated('File')
            .where('File.bActive', true)
            .withGraphFetched('File')
            .modifyGraph('File', fileBuilder => {
                fileBuilder.where('bActive', true);
                fileBuilder.withGraphFetched('CreatedByUser').modifyGraph('CreatedByUser', builder => {
                    builder.select('sName', 'sLastName', 'sEmail');
                })
                fileBuilder.withGraphFetched('LastUpdatedByUser').modifyGraph('LastUpdatedByUser', builder => {
                    builder.select('sName', 'sLastName', 'sEmail');
                });
                if (sSearch) {
                    fileBuilder.where(function () {
                        this.whereRaw(`unaccent("sFileName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                            .orWhereRaw(`unaccent("sFileType") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                    });
                }
                fileBuilder.orderBy('updated_at', 'desc');
            });
            if (sSearch) {
                queryBuilder.where(function () {
                    this.whereRaw(`unaccent("sFileName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("sFileType") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }
            queryBuilder.orderBy('File.updated_at', 'desc')
        })
    }

     // Get ONE GoalFile by Goal
     static async findOneGoalFileByGoal(sGoalFileId, sGoalId) {
        return GoalFilesModel.query().modify(function (queryBuilder : any) {
            queryBuilder
                .findById(sGoalFileId)
                .where('sGoalId', sGoalId)
                .joinRelated('File')
                .where('File.bActive', true)
                 // GET Created by user info and LastUpatedBy user info
                .withGraphFetched('File.[CreatedByUser, LastUpdatedByUser]')
                .modifyGraph('File', fileBuilder => {
                    fileBuilder.where('bActive', true);
                    fileBuilder.withGraphFetched('CreatedByUser').modifyGraph('CreatedByUser', builder => {
                        builder.select('sName', 'sLastName', 'sEmail');
                    })
                    fileBuilder.withGraphFetched('LastUpdatedByUser').modifyGraph('LastUpdatedByUser', builder => {
                        builder.select('sName', 'sLastName', 'sEmail');
                    });
                })

        })
    }

    // DELETE goalFile
    static async deleteGoalFile(sGoalFileId) {
        return await FilesModel.query().patchAndFetchById(sGoalFileId, {
            bActive: false
        }).where('bActive', true);
    }
}

export default Queries;
