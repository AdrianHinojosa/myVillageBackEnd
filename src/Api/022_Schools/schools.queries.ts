import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../Config/Db.config';
import { Page } from 'objection';
import { UsersModel, IUsers } from '../004_Users/users.model';
import { SchoolsModel, ISchools } from './schools.model';
import { SchoolUsersModel, ISchoolUser  } from './001_SchoolUsers/schoolUsers.model';

class Queries {
    constructor() {
    };

    // DONE: Verify school Exists and not blocked
    static async verifySchoolExists(sSchoolId) {
        return await SchoolsModel.query().findById(sSchoolId).select('*').where('bActive', true)
    }

    // DONE: Insert school
    static async insertSchool({sName, sPhone, sEmail, sAddress, sCityId, iUsersLimit, iStudentsLimit, sCreatedBy, sAdminName, sLastName, sSecondLastName}: any) {
        return await SchoolsModel.transaction(async (trx) => {

            // Insert into School table
            const newSchool = await SchoolsModel.query(trx).insert({
                sName,
                sPhone,
                sEmail,
                sAddress,
                sCityId,
                iUsersLimit,
                iStudentsLimit,
                bBlocked: false,
                sCreatedBy,
                bActive: true
            }).returning('*');

            // Insert into Users table
            const newUser = await UsersModel.query(trx).insert({
                sName: sAdminName || sName,
                sLastName,
                sSecondLastName,
                sEmail,
                sImageKey: '',
                bPlatformAccess: false,
                bVerified: false,
                bActive: true
            }).returning('*');

            // Insert into SchoolUsers table
            const newSchoolUser = await SchoolUsersModel.query(trx).insert({
                sSchoolUserId: newUser.sUserId,
                sSchoolId: newSchool.sSchoolId
            }).returning('*');

            // Return school and user
            return {school: newSchool, user: newUser};
        });

    }

    // Done: Update school
    static async updateSchool(sSchoolId, {sName, sPhone, sCityId, iUsersLimit, iStudentsLimit, sLastUpdatedBy}) {

        return await SchoolsModel.transaction(async (trx) => {
            // Update school
            let updatedSchool =  await SchoolsModel.query(trx).patchAndFetchById(sSchoolId, {
                sName,
                sPhone,
                sCityId,
                iUsersLimit,
                iStudentsLimit,
                sLastUpdatedBy
            }).where('bActive', true);

            // GET updated school with fields required
            let mySchool =  await SchoolsModel.query(trx).findById(sSchoolId).select('Schools.*')
                    .select('City.sName AS sCityName', 'City.sCityId')
                    .select('City:State.sName AS sStateName', 'City:State.sStateId')
                    .select('City:State:Country.sName AS sCountryName', 'City:State:Country.sCountryId')
                    .where('Schools.bActive', true)
                    .leftJoinRelated('City')
                    .leftJoinRelated('City.State')
                    .leftJoinRelated('City.State.Country')
                    .withGraphFetched('SchoolUser')
                    .modifyGraph('SchoolUser', builder => {
                        builder.joinRelated('User')
                        builder.select('User.sName', 'User.sLastName',  'User.sSecondLastName', 'User.sEmail', 'User.sPhoneNumber');
                        builder.where('User.sCreatedBy', null)
                        builder.where('User.bActive', true)
                    })

            return mySchool;
        });

    }

    /**
     *
     * @param iPageNumber
     * @param iPageSize
     * @param sSearch (general search by name, email, phone, city)
     * @returns
     */
    static async findAllSchools(iPageNumber, iItemsPerPage, sSearch, bBlocked) {
        return await SchoolsModel.query().modify(function (queryBuilder : any) {
            queryBuilder.select('Schools.*')
            queryBuilder.select('City.sName AS sCityName', 'City.sCityId')
            queryBuilder.select('City:State.sName AS sStateName', 'City:State.sStateId')
            queryBuilder.select('City:State:Country.sName AS sCountryName', 'City:State:Country.sCountryId')
            queryBuilder.where('Schools.bActive', true)
            queryBuilder.leftJoinRelated('City')
            queryBuilder.leftJoinRelated('City.State')
            queryBuilder.leftJoinRelated('City.State.Country')
            queryBuilder.withGraphFetched('SchoolUser')
            queryBuilder.modifyGraph('SchoolUser', builder => {
                builder.joinRelated('User')
                builder.select('User.sName', 'User.sLastName',  'User.sSecondLastName', 'User.sEmail', 'User.sPhoneNumber');
                builder.where('User.sCreatedBy', null)
                builder.where('User.bActive', true)
            })

            if (sSearch) {
                // Flag unaccent
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("Schools"."sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Schools"."sEmail") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Schools"."sPhone") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }

            if (bBlocked == true) {
                queryBuilder.where('Schools.bBlocked', true)
            }
            else if (bBlocked == false) {
                queryBuilder.where('Schools.bBlocked', false)
            }
        }).orderBy('Schools.updated_at', 'desc').page((iPageNumber - 1), iItemsPerPage)
    }


    // Get ONE School
    static async findOneSchool(sSchoolId) {
        return await SchoolsModel.query().findById(sSchoolId).select('Schools.*')
                                    .select('City.sName AS sCityName', 'City.sCityId')
                                    .select('City:State.sName AS sStateName', 'City:State.sStateId')
                                    .select('City:State:Country.sName AS sCountryName', 'City:State:Country.sCountryId')
                                    .where('Schools.bActive', true)
                                    .leftJoinRelated('City')
                                    .leftJoinRelated('City.State')
                                    .leftJoinRelated('City.State.Country')
                                    .withGraphFetched('SchoolUser')
                                    .modifyGraph('SchoolUser', builder => {
                                        builder.joinRelated('User')
                                        builder.select('User.sName', 'User.sLastName',  'User.sSecondLastName', 'User.sEmail', 'User.sPhoneNumber');
                                        builder.where('User.sCreatedBy', null)
                                        builder.where('User.bActive', true)
                                    })
    }

    // Patch School as bBlocked true/false
    static async patchSchoolBlocked(sSchoolId, bBlocked) {

        return await  SchoolsModel.transaction(async (trx) => {
            // Block school
            const blockedSchool = await  SchoolsModel.query(trx).patchAndFetchById(sSchoolId, {
                bBlocked: bBlocked
            }).where('bActive', true)

            // Block users of that school by using a subquery
            var updatedUsers;
            // If blocking, block ALL Users
            if (bBlocked == true) {
                updatedUsers = await UsersModel.query(trx)
                    .patch({ bPlatformAccess: false })
                    .whereIn('sUserId',
                        SchoolUsersModel.query(trx)
                        .select('sSchoolUserId')
                        .where('sSchoolId', sSchoolId)
                    )
                    .andWhere('bActive', true)
                    .returning('*');
            }
            // If UNBLOCKING only unblock super school users.
            else {
                updatedUsers = await UsersModel.query(trx)
                    .patch({ bPlatformAccess: true })
                    .whereIn('sUserId',
                        SchoolUsersModel.query(trx)
                        .select('sSchoolUserId')
                        .where('sSchoolId', sSchoolId)
                    )
                    .where('sCreatedBy', null)
                    .andWhere('bActive', true)
                    .returning('*');
            }

             // Return school
             return {school: blockedSchool};
        });

    }

    // Done: Delete school (soft delete with sLastDeletedBy)
    static async deleteSchool(sSchoolId, sLastDeletedBy) {
        return await SchoolsModel.transaction(async (trx) => {
            // Delete school
            const deletedSchool = await  SchoolsModel.query(trx).patchAndFetchById(sSchoolId, {
                bActive: false,
                sLastDeletedBy: sLastDeletedBy
            }).where('bActive', true)

            // Cascade delete users of that school by using a subquery
            var deletedUsers;
            deletedUsers = await UsersModel.query(trx).patch({ bActive: false, sLastDeletedBy: sLastDeletedBy })
                                            .whereIn('sUserId',
                                                SchoolUsersModel.query(trx)
                                                .select('sSchoolUserId')
                                                .where('sSchoolId', sSchoolId)
                                            )
                                            .andWhere('bActive', true)
                                            .returning('*');

             // Return school
             return {school: deletedSchool};
        });
    }


    // Get COUNT of active schools
    static async findCountOfActiveSchools() {
        const query = SchoolsModel.query()
            .count('sSchoolId as count')
            .where('bActive', true)
        const result = await query.first();
        return parseInt(result?.count ?? '0');
    }


    // Update School Image
    static async updateSchoolImage(sSchoolId: string, sImageKey: string) {
        return await SchoolsModel.query().patchAndFetchById(sSchoolId, {
            sImageKey: sImageKey
        }).where('bActive', true);
    }

}

export default Queries;
