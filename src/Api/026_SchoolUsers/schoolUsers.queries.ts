import { db } from '../../Config/Db.config';
import { UsersModel } from '../004_Users/users.model';
import { SchoolUsersModel } from '../022_Schools/001_SchoolUsers/schoolUsers.model';

class Queries {
    constructor() {};

    // Find all school users with computed fields
    static async findAllSchoolUsers(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sType, bActive) {
        const query = UsersModel.query().modify(function (queryBuilder: any) {
            queryBuilder.select(
                'Users.sUserId AS sSchoolUserId',
                'Users.sName',
                'Users.sLastName',
                'Users.sSecondLastName',
                'Users.sEmail',
                'Users.bVerified',
                'Users.bActive'
            );

            // Computed: sFullName
            queryBuilder.select(db.raw(`
                TRIM(CONCAT_WS(' ', "Users"."sName", "Users"."sLastName", "Users"."sSecondLastName")) AS "sFullName"
            `));

            queryBuilder.select('Users.sType');

            queryBuilder.innerJoin('SchoolUsers', 'SchoolUsers.sSchoolUserId', '=', 'Users.sUserId');
            queryBuilder.where('SchoolUsers.sSchoolId', sSchoolId);
            queryBuilder.where('Users.bActive', true);

            if (sSearch) {
                queryBuilder.where(function () {
                    this.whereRaw(`unaccent("Users"."sName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Users"."sLastName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Users"."sSecondLastName") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%'])
                        .orWhereRaw(`unaccent("Users"."sEmail") ILIKE unaccent(?)`, ['%' + String(sSearch) + '%']);
                });
            }

            if (sType) {
                queryBuilder.where('Users.sType', sType);
            }

            if (bActive === true || bActive === false) {
                queryBuilder.where('Users.bActive', bActive);
            }
        }).orderBy('Users.created_at', 'desc').page((iPageNumber - 1), iItemsPerPage);

        return query;
    }

    // Count active school users
    static async countActiveSchoolUsers(sSchoolId) {
        const result = await SchoolUsersModel.query()
            .join('Users', 'Users.sUserId', '=', 'SchoolUsers.sSchoolUserId')
            .where('SchoolUsers.sSchoolId', sSchoolId)
            .where('Users.bActive', true)
            .count('SchoolUsers.sSchoolUserId as count')
            .first();
        return parseInt(result?.count ?? '0');
    }

    // Find one school user
    static async findOneSchoolUser(sSchoolId, sSchoolUserId) {
        return await UsersModel.query()
            .select(
                'Users.sUserId AS sSchoolUserId',
                'Users.sName',
                'Users.sLastName',
                'Users.sSecondLastName',
                'Users.sEmail',
                'Users.sCreatedBy',
                'Users.bVerified',
                'Users.bActive',
                'Users.created_at'
            )
            .select(db.raw(`
                TRIM(CONCAT_WS(' ', "Users"."sName", "Users"."sLastName", "Users"."sSecondLastName")) AS "sFullName"
            `))
            .select('Users.sType')
            .innerJoin('SchoolUsers', 'SchoolUsers.sSchoolUserId', '=', 'Users.sUserId')
            .where('SchoolUsers.sSchoolId', sSchoolId)
            .where('Users.sUserId', sSchoolUserId)
            .where('Users.bActive', true)
            .first();
    }

    // Check if email exists in school
    static async emailExistsInSchool(sSchoolId, sEmail) {
        return await UsersModel.query()
            .innerJoin('SchoolUsers', 'SchoolUsers.sSchoolUserId', '=', 'Users.sUserId')
            .where('SchoolUsers.sSchoolId', sSchoolId)
            .where('Users.sEmail', sEmail.toLowerCase())
            .where('Users.bActive', true)
            .first();
    }

    // Create school user (insert into Users + SchoolUsers)
    static async insertSchoolUser(sSchoolId, { sName, sLastName, sSecondLastName, sEmail, sType, sCreatedBy }) {
        return await UsersModel.transaction(async (trx) => {
            // Insert into Users table
            const newUser = await UsersModel.query(trx).insert({
                sName,
                sLastName,
                sSecondLastName,
                sEmail: sEmail.toLowerCase(),
                sImageKey: '',
                sType: sType || 'FACULTY',
                sCreatedBy,
                bPlatformAccess: false,
                bVerified: false,
                bActive: true
            }).returning('*');

            // Insert into SchoolUsers junction
            await SchoolUsersModel.query(trx).insert({
                sSchoolUserId: newUser.sUserId,
                sSchoolId
            });

            return newUser;
        });
    }

    // Update school user (update Users table)
    static async updateSchoolUser(sSchoolUserId, { sName, sLastName, sSecondLastName, sType, bActive, sLastUpdatedBy }) {
        const patchData: any = { sName, sLastName, sSecondLastName, sLastUpdatedBy };
        if (sType) patchData.sType = sType;
        if (bActive !== undefined && bActive !== null) {
            patchData.bActive = bActive;
            if (bActive === false) {
                patchData.bPlatformAccess = false;
            }
        }
        return await UsersModel.query().patchAndFetchById(sSchoolUserId, patchData).where('bActive', true);
    }
}

export default Queries;
