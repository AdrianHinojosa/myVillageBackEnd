import {SelectJsonData, db, RawQueryInArray, RawQuery } from '../../../Config/Db.config'
import { Page } from 'objection';
import { UsersModel, IUsers } from "../../004_Users/users.model"
import { SchoolPermissionsModel } from './schoolPermissions.model';
import { SchoolModulesModel } from './001_School_Modules/schoolModules.model';
import { SchoolUsersModel } from './schoolUsers.model';

type ActionCode = 'READ' | 'WRITE';

type Permission = {
    sModuleName: string;
    sActionCode: 'WRITE' | 'READ' | 'ADMIN' | 'FORBIDDEN';
  };


interface SchoolPermissions {
    sSchoolId: string,
    sSchoolModuleId: string,
    sActionCode: ActionCode
}

class Queries {
    constructor() {};

    // ======= FOR Assignments ===========
    // DONE: Verify school user Exists
    static async verifySchoolUserExistsBySchool(sSchoolId, sSchoolUserId) {
        return await SchoolUsersModel.query().findById(sSchoolUserId).select('*')
                                                .where('SchoolUsers.sSchoolId', sSchoolId)
                                                .joinRelated('User')
                                                .where('User.bActive', true)

    }

    // ===================================

    // ======== School PERMISSIONS =================

    // Used: Verify a permission exists
    static async verifySchoolModulesExists(sArrModules) {
        return await SchoolModulesModel.query().whereIn('sSchoolModuleId', sArrModules);
    }

    // Used: Verify a permission exists
    static async insertSchoolPermissions(arrPermissions : SchoolPermissions[]) {
        return await SchoolPermissionsModel.query().insert(arrPermissions);
    }

    // Used: Verify School user authorizedForModules
    // Return a boolean if the school user has ALL the permissions required.
    static async bIsSchoolUserAuthorizedForModules(sSchoolUserId: string, sArrPermissions: Permission[]) : Promise<Boolean> {
        const count = await SchoolPermissionsModel.query()
        .join('SchoolModules', 'SchoolModules.sSchoolModuleId', '=', 'SchoolPermissions.sSchoolModuleId')
        .where('SchoolPermissions.sSchoolUserId', sSchoolUserId)
        .andWhere('SchoolPermissions.sActionCode', '!=', 'FORBIDDEN')
        .andWhere(function () {
            for (const permission of sArrPermissions) {
                this.orWhere(function () {
                    this.where('SchoolModules.sUniqueName', permission.sModuleName)
                    .andWhere('SchoolPermissions.sActionCode', permission.sActionCode);
                });
            }
        })
        .countDistinct('SchoolPermissions.sSchoolPermissionId as count')
        .first();

        if (!count || !count.count) {
            return false;
        }
        else {
            return ( Number(count.count) === sArrPermissions.length)
        }
    }

    // ============ END School Permissions ===============================

    // Add this method to check if user has ADMIN permission for a specific module
    static async bHasAdminPermissionForModule(sSchoolUserId: string, sModuleName: string): Promise<boolean> {
        const count = await SchoolPermissionsModel.query()
            .join('SchoolModules', 'SchoolModules.sSchoolModuleId', '=', 'SchoolPermissions.sSchoolModuleId')
            .where('SchoolPermissions.sSchoolUserId', sSchoolUserId)
            .where('SchoolModules.sUniqueName', sModuleName)
            .where('SchoolPermissions.sActionCode', 'ADMIN')
            .count('SchoolPermissions.sSchoolPermissionId as count')
            .first();

        return Number(count?.count || 0) > 0;
    }

    /**
     * Used: Verify School user has ANY of the specified permissions
     * Return a boolean if the school user has AT LEAST ONE of the permissions required.
     */
    static async bIsSchoolUserAuthorizedForAnyModules(sSchoolUserId: string, sArrPermissions: Permission[]): Promise<Boolean> {
        const count = await SchoolPermissionsModel.query()
            .join('SchoolModules', 'SchoolModules.sSchoolModuleId', '=', 'SchoolPermissions.sSchoolModuleId')
            .where('SchoolPermissions.sSchoolUserId', sSchoolUserId)
            .andWhere('SchoolPermissions.sActionCode', '!=', 'FORBIDDEN')
            .andWhere(function () {
                for (const permission of sArrPermissions) {
                    this.orWhere(function () {
                        this.where('SchoolModules.sUniqueName', permission.sModuleName)
                            .andWhere(function() {
                                // Check for exact permission OR ADMIN permission
                                this.where('SchoolPermissions.sActionCode', permission.sActionCode)
                                    .orWhere('SchoolPermissions.sActionCode', 'ADMIN');
                            });
                    });
                }
            })
            .countDistinct('SchoolPermissions.sSchoolPermissionId as count')
            .first();

        if (!count || !count.count) {
            return false;
        } else {
            // Return true if ANY permission is found (count > 0)
            return (Number(count.count) > 0);
        }
    }

    /**
     * Used: Verify School user has ANY of the specified permissions OR is super admin
     * Return a boolean if the school user is super admin (Users.sCreatedBy = null) OR has AT LEAST ONE of the permissions required.
     */
    static async bIsSchoolUserAuthorizedForAnyModulesOrSuperAdmin(sSchoolUserId: string, sArrPermissions: Permission[]): Promise<Boolean> {
        // Check if user is super admin by joining to Users table
        const user = await SchoolUsersModel.query()
            .select('Users.sCreatedBy')
            .innerJoin('Users', 'Users.sUserId', '=', 'SchoolUsers.sSchoolUserId')
            .where('SchoolUsers.sSchoolUserId', sSchoolUserId)
            .first();

        if (user?.sCreatedBy === null) {
            // Super admin has all permissions
            return true;
        }

        // If not super admin, check specific permissions
        const count = await SchoolPermissionsModel.query()
            .join('SchoolModules', 'SchoolModules.sSchoolModuleId', '=', 'SchoolPermissions.sSchoolModuleId')
            .where('SchoolPermissions.sSchoolUserId', sSchoolUserId)
            .andWhere('SchoolPermissions.sActionCode', '!=', 'FORBIDDEN')
            .andWhere(function () {
                for (const permission of sArrPermissions) {
                    this.orWhere(function () {
                        this.where('SchoolModules.sUniqueName', permission.sModuleName)
                            .andWhere(function() {
                                // Check for exact permission OR ADMIN permission
                                this.where('SchoolPermissions.sActionCode', permission.sActionCode)
                                    .orWhere('SchoolPermissions.sActionCode', 'ADMIN');
                            });
                    });
                }
            })
            .countDistinct('SchoolPermissions.sSchoolPermissionId as count')
            .first();

        if (!count || !count.count) {
            return false;
        } else {
            // Return true if ANY permission is found (count > 0)
            return (Number(count.count) > 0);
        }
    }


}

export default Queries;
