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


    // Get comprehensive schools analytics data
    static async findSchoolsAnalytics() {
        const [schoolsResult, studentsResult, goalsResult, usersResult, recentSchoolsResult] = await Promise.all([

            // 1. School counts: total, non-blocked (active), blocked (inactive)
            db.raw(`
                SELECT
                    COUNT(*)                                          ::integer AS "iTotalSchools",
                    COUNT(*) FILTER (WHERE "bBlocked" = false)       ::integer AS "iActiveSchools",
                    COUNT(*) FILTER (WHERE "bBlocked" = true)        ::integer AS "iInactiveSchools"
                FROM "Schools"
                WHERE "bActive" = true
            `),

            // 2. Total students and average per active school
            db.raw(`
                SELECT
                    COALESCE(SUM(sc_cnt.cnt), 0)                                     ::integer AS "iTotalStudents",
                    COALESCE(ROUND(AVG(COALESCE(sc_cnt.cnt, 0))::numeric, 1), 0)     ::float8  AS "dAvgStudents"
                FROM "Schools" sc
                LEFT JOIN (
                    SELECT "sSchoolId", COUNT("sStudentId") AS cnt
                    FROM "Students"
                    WHERE "bActive" = true
                    GROUP BY "sSchoolId"
                ) AS sc_cnt ON sc_cnt."sSchoolId" = sc."sSchoolId"
                WHERE sc."bActive" = true
            `),

            // 3. Goal completion rate (goals linked to active schools only)
            db.raw(`
                SELECT
                    COUNT(g.*)                                                    ::integer AS "iTotalGoals",
                    COUNT(g.*) FILTER (WHERE g."sStatus" = 'completed')          ::integer AS "iCompletedGoals"
                FROM "Goals" g
                WHERE g."bActive" = true
            `),

            // 4. Average teachers (sCreatedBy NOT NULL) and admin (sCreatedBy IS NULL) per active school
            db.raw(`
                SELECT
                    COALESCE(ROUND(AVG(COALESCE(t_cnt.cnt, 0))::numeric, 1), 0)  ::float8 AS "dAvgTeachers",
                    COALESCE(ROUND(AVG(COALESCE(a_cnt.cnt, 0))::numeric, 1), 0)  ::float8 AS "dAvgAdminStaff"
                FROM "Schools" sc
                LEFT JOIN (
                    SELECT su."sSchoolId", COUNT(su."sSchoolUserId") AS cnt
                    FROM "SchoolUsers" su
                    JOIN "Users" u ON u."sUserId" = su."sSchoolUserId"
                        AND u."bActive" = true AND u."sCreatedBy" IS NOT NULL
                    GROUP BY su."sSchoolId"
                ) AS t_cnt ON t_cnt."sSchoolId" = sc."sSchoolId"
                LEFT JOIN (
                    SELECT su."sSchoolId", COUNT(su."sSchoolUserId") AS cnt
                    FROM "SchoolUsers" su
                    JOIN "Users" u ON u."sUserId" = su."sSchoolUserId"
                        AND u."bActive" = true AND u."sCreatedBy" IS NULL
                    GROUP BY su."sSchoolId"
                ) AS a_cnt ON a_cnt."sSchoolId" = sc."sSchoolId"
                WHERE sc."bActive" = true
            `),

            // 5. 5 most recently created active schools with student and teacher counts
            db.raw(`
                SELECT
                    sc."sSchoolId",
                    sc."sName",
                    (NOT sc."bBlocked")                                 AS "bActive",
                    sc."created_at"                                     AS "dtCreatedAt",
                    COALESCE(s_cnt.cnt, 0)                              ::integer AS "iStudents",
                    COALESCE(t_cnt.cnt, 0)                              ::integer AS "iTeachers"
                FROM "Schools" sc
                LEFT JOIN (
                    SELECT "sSchoolId", COUNT("sStudentId") AS cnt
                    FROM "Students"
                    WHERE "bActive" = true
                    GROUP BY "sSchoolId"
                ) AS s_cnt ON s_cnt."sSchoolId" = sc."sSchoolId"
                LEFT JOIN (
                    SELECT su."sSchoolId", COUNT(su."sSchoolUserId") AS cnt
                    FROM "SchoolUsers" su
                    JOIN "Users" u ON u."sUserId" = su."sSchoolUserId"
                        AND u."bActive" = true AND u."sCreatedBy" IS NOT NULL
                    GROUP BY su."sSchoolId"
                ) AS t_cnt ON t_cnt."sSchoolId" = sc."sSchoolId"
                WHERE sc."bActive" = true
                ORDER BY sc."created_at" DESC
                LIMIT 5
            `),
        ]);

        // Parse and structure results
        const schools  = schoolsResult.rows[0];
        const students = studentsResult.rows[0];
        const goals    = goalsResult.rows[0];
        const users    = usersResult.rows[0];

        const iTotalGoals     = parseInt(goals?.iTotalGoals     ?? '0');
        const iCompletedGoals = parseInt(goals?.iCompletedGoals ?? '0');
        const iGoalProgress   = iTotalGoals > 0
            ? Math.round((iCompletedGoals / iTotalGoals) * 100)
            : 0;

        return {
            iTotalSchools:    parseInt(schools?.iTotalSchools    ?? '0'),
            iActiveSchools:   parseInt(schools?.iActiveSchools   ?? '0'),
            iInactiveSchools: parseInt(schools?.iInactiveSchools ?? '0'),
            iTotalStudents:   parseInt(students?.iTotalStudents  ?? '0'),
            dAvgStudents:     parseFloat(students?.dAvgStudents  ?? '0'),
            iTotalGoals,
            iCompletedGoals,
            iGoalProgress,
            dAvgTeachers:     parseFloat(users?.dAvgTeachers   ?? '0'),
            dAvgAdminStaff:   parseFloat(users?.dAvgAdminStaff ?? '0'),
            aRecentSchools:   recentSchoolsResult.rows,
        };
    }


    // Update School Image
    static async updateSchoolImage(sSchoolId: string, sImageKey: string) {
        return await SchoolsModel.query().patchAndFetchById(sSchoolId, {
            sImageKey: sImageKey
        }).where('bActive', true);
    }

}

export default Queries;
