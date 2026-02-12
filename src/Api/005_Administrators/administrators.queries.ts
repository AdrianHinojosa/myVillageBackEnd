import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../Config/Db.config'
import { Page } from 'objection';
import { UsersModel, IUsers } from "../004_Users/users.model"
import { AdministratorsModel, IAdministrators } from './administrators.model';
import { AdministratorPermissionsModel } from './administrator_permissions.model';
import { AdministratorModulesModel } from '../005_Administrators/001_Administrator_Modules/administratorModules.model';

type ActionCode = 'READ' | 'WRITE';

type Permission = {
    sModuleName: string;
    sActionCode: 'WRITE' | 'READ' | 'DELETE' | 'FORBIDDEN';
  };

interface AdminPermission {
    sAdministratorId: string,
    sAdministratorModuleId: string,
    sActionCode: ActionCode
}

interface Admin {
    sUserId: string;
    sAdministratorId: string;
    sManagerId: string;
    iCode: number;
    iAdminCode: number;
    sName: string;
    sLastName: string;
    sEmail: string;
    sPassword: string;
    sUserPictureFileKey: string;
    sPhoneNumber: string;
    sPhoneExtension: string;
    bPlatformAccess: boolean;
    bVerified: boolean;
    bActive: boolean;
    created_at: Date;
    updated_at: Date;
}

class Queries {
    constructor() {
    };

    // VERIFY exists
     static async verifyAdministratorExists(sAdministratorId) {
        return await AdministratorsModel.query().modify(function (queryBuilder : any) {
            queryBuilder
                .findById(sAdministratorId)
                .select('Administrators.*')
                .joinRelated('User')
                .where('User.bActive', true)
        })
    }



    // ======== ADMIN PERMISSIONS =================

    // Used: Verify a permission exists
    static async verifyAdministratorModulesExists(sArrModules) {
        return await AdministratorModulesModel.query().whereIn('sAdministratorModuleId', sArrModules);
    }

    // Used: Verify a permission exists
    static async insertAdministratorPermissions(arrPermissions : AdminPermission[]) {
        return await AdministratorPermissionsModel.query().insert(arrPermissions);
    }

    // Used: Verify Admin authorizedForModules
    // Return a boolean if the administrator has ALL the permissions required.
    static async bIsAdminAuthorizedForModules(sAdministratorId: string, sArrPermissions: Permission[]) : Promise<Boolean> {
        const count = await AdministratorPermissionsModel.query()
        .join('AdministratorModules', 'AdministratorModules.sAdministratorModuleId', '=', 'AdministratorPermissions.sAdministratorModuleId')
        .where('AdministratorPermissions.sAdministratorId', sAdministratorId)
        .andWhere('AdministratorPermissions.sActionCode', '!=', 'FORBIDDEN')
        .andWhere(function () {
            for (const permission of sArrPermissions) {
            this.orWhere(function () {
                this.where('AdministratorModules.sName', permission.sModuleName)
                .andWhere('AdministratorPermissions.sActionCode', permission.sActionCode);
            });
            }
        })
        .countDistinct('AdministratorPermissions.sAdministratorPermissionId as count')
        .first();

       
        if (!count || !count.count) {
            return false;
        }
        else {
            return ( Number(count.count) === sArrPermissions.length)
        }
    }



    // ============ END Admin Permissions ===============================

   // Used: Insert an admin.
   static async insertAdmin({ sName, sLastName, sSecondLastName, sEmail, sPhoneNumber, sPhoneExtension, sCreatedBy }) {
        return await AdministratorsModel.transaction(async (trx) => {
            // Insert into Users table
            const newUser = await UsersModel.query(trx).insert({
                sName,
                sLastName,
                sSecondLastName,
                sEmail,
                sPhoneNumber,
                sPhoneExtension,
                sImageKey: '',
                sCreatedBy: sCreatedBy,
                sLastUpdatedBy: sCreatedBy,
                bPlatformAccess: true,
                bVerified: false,
                bActive: true
            }).returning('*');
    
            // Insert into Administrators table
            const newAdmin= await AdministratorsModel.query(trx).insert({
                sAdministratorId: newUser.sUserId,
            }).returning('*');

             // Combine fields of newUser and newAdmin into one object of Admin format
            const combinedAdmin: Admin = {
                ...newUser,   // Spread the properties of newUser
                ...newAdmin, // Spread the properties of newAdmin (overwriting common properties, if any)
            };

            return combinedAdmin;
        });
        
    }

    // Used. Get one admin by email.
    static async getOneAdministratorByEmail(sEmail, sUserId = null): Promise<any> {
        return await AdministratorsModel.query().modify( build => {
            build.join('Users', 'Users.sUserId', 'Administrators.sAdministratorId')
            .select('Administrators.*', 'Users.sEmail') // This line ensures you select all fields from Administrators and the sEmail from Users.
            .where('Users.sEmail', sEmail)
            .andWhere('Users.bActive', true)
                if (sUserId) {
                    build.andWhereNot('Administrators.sAdministratorId', sUserId);
                }
            })
            .first();
    }



    // Get ALL Administrators. 
    /**
     * 
     * @param iPageNumber 
     * @param iPageSize 
     * @param sSearch (general serach by name, descriptions, phone number, city)
     * @returns 
     */
    static async findAllAdministrators(iPageNumber, iItemsPerPage, sSearch, bPlatformAccess) {
        return await AdministratorsModel.query().modify(function (queryBuilder : any) {
            queryBuilder.withGraphJoined('User')
            queryBuilder.whereNotNull('User.sCreatedBy')
            queryBuilder.where('User.bActive', true)
            if (sSearch) {
                // Flag unaccent
                queryBuilder.where(function (){
                    this.whereRaw(`unaccent("User"."sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("User"."sLastName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("User"."sEmail") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("User"."sPhoneNumber") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                })
            }
            if (bPlatformAccess == true) {
                queryBuilder.where('User.bPlatformAccess', true)
            }
            else if (bPlatformAccess == false) {
                queryBuilder.where('User.bPlatformAccess', false)
            }
        })
        .orderBy('User.updated_at', 'desc')
        .page((iPageNumber - 1), iItemsPerPage)
    }


     // Get ONE Administrator
     static async findOneAdministrator(sAdministratorId) {
        return AdministratorsModel.query().modify(function (queryBuilder : any) {
            queryBuilder
                .findById(sAdministratorId)
                .withGraphJoined('User')
                .modifyGraph('User', builder => {
                    builder.where('bActive', true);
                    // GET Created by user info and LastUpatedBy user info
                    builder.withGraphFetched('[CreatedByUser, LastUpdatedByUser]')
                        .modifyGraph('CreatedByUser', builder => {
                            builder.select('sName', 'sLastName', 'sEmail');
                        })
                        .modifyGraph('LastUpdatedByUser', builder => {
                            builder.select('sName', 'sLastName', 'sEmail');
                        });
                })
                .withGraphFetched('AdministratorPermissions')
                    .modifyGraph('AdministratorPermissions', builder => {
                        builder.select('AdministratorPermissions.*');
                        builder.select('AdministratorModules.sName');
                        builder.innerJoin('AdministratorModules', 'AdministratorModules.sAdministratorModuleId', '=', 'AdministratorPermissions.sAdministratorModuleId')
                        builder.orderBy('AdministratorModules.sName', 'ASC')
                    })
        })
    }


    // UPDATE One administrator
    static async updateAdministrator(sAdministratorId, { sUserId, sName, sLastName, sSecondLastName, sPhoneNumber, sPhoneExtension, aAdministratorPermissionsSet}) {
        // START transaction
        return await AdministratorsModel.transaction(async (trx) => {
            // 1. Update User related to the Administrator
            await UsersModel.query(trx).patchAndFetchById(sAdministratorId, {
                sName: sName,
                sLastName: sLastName,
                sSecondLastName: sSecondLastName,
                sPhoneNumber: sPhoneNumber,
                sPhoneExtension: sPhoneExtension,
                sLastUpdatedBy: sUserId
            }).where('bActive', true);
            
            // 2. Update Administrator 
            // await AdministratorsModel.query(trx).patchAndFetchById(sAdministratorId, {
            //     sJobRole: sJobRole
            // })
            // 3. Delete existing Administrator Permissions
            await AdministratorPermissionsModel.query(trx).delete().where('sAdministratorId', sAdministratorId);

            // 4. Insert new Administrator Permissions
            await AdministratorPermissionsModel.query(trx).insert(aAdministratorPermissionsSet);

            // 5. Fetch and return the updated administrator
            const updatedAdministrator = await AdministratorsModel.query(trx)
                    .findById(sAdministratorId)
                    .withGraphJoined('User')
                    .modifyGraph('User', builder => {
                        builder.where('bActive', true);
                        // GET Created by user info and LastUpatedBy user info
                        builder.withGraphFetched('[CreatedByUser, LastUpdatedByUser]')
                            .modifyGraph('CreatedByUser', builder => {
                                builder.select('sName', 'sLastName', 'sEmail');
                            })
                            .modifyGraph('LastUpdatedByUser', builder => {
                                builder.select('sName', 'sLastName', 'sEmail');
                            });
                    })
                    .withGraphFetched('AdministratorPermissions')
                        .modifyGraph('AdministratorPermissions', builder => {
                            builder.select('AdministratorPermissions.*');
                            builder.select('AdministratorModules.sName');
                            builder.innerJoin('AdministratorModules', 'AdministratorModules.sAdministratorModuleId', '=', 'AdministratorPermissions.sAdministratorModuleId')
                            builder.orderBy('AdministratorModules.sName', 'ASC')
                    })
   
            return updatedAdministrator;
        });
    }

    // SET bPlatformAccess
    static async patchPlatformAccess(sAdministratorId, bPlatformAccess) {
        await UsersModel.query().patchAndFetchById(sAdministratorId, {
            bPlatformAccess: bPlatformAccess
        }).where('bActive', true);
    
        const updatedAdministrator = await AdministratorsModel.query()
            .findById(sAdministratorId)
            .withGraphJoined('User')
            .where('User.bActive', true)
            .withGraphJoined('AdministratorPermissions')
                .modifyGraph('AdministratorPermissions', builder => {
                    builder.select('AdministratorPermissions.*');
                    builder.select('AdministratorModules.sName');
                    builder.innerJoin('AdministratorModules', 'AdministratorModules.sAdministratorModuleId', '=', 'AdministratorPermissions.sAdministratorModuleId')
                    builder.orderBy('AdministratorModules.sName', 'ASC')
            })
        return updatedAdministrator;
    }

    // DELETE administrator
    static async deleteAdministrator(sAdministratorId) {
        return await UsersModel.query().patchAndFetchById(sAdministratorId, {
            bActive: false
        }).where('bActive', true);
    }
        


}

export default Queries;