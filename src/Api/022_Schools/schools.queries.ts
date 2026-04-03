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

            // Computed: iUsers count
            queryBuilder.select(db.raw(`
                (SELECT COUNT(*)::integer FROM "SchoolUsers" su
                 JOIN "Users" u ON u."sUserId" = su."sSchoolUserId" AND u."bActive" = true
                 WHERE su."sSchoolId" = "Schools"."sSchoolId"
                ) AS "iUsers"
            `))

            // Computed: iStudents count
            queryBuilder.select(db.raw(`
                (SELECT COUNT(*)::integer FROM "Students" st
                 WHERE st."sSchoolId" = "Schools"."sSchoolId" AND st."bActive" = true
                ) AS "iStudents"
            `))

            queryBuilder.where('Schools.bActive', true)
            queryBuilder.leftJoinRelated('City')
            queryBuilder.leftJoinRelated('City.State')
            queryBuilder.leftJoinRelated('City.State.Country')
            queryBuilder.withGraphFetched('SchoolUser')
            queryBuilder.modifyGraph('SchoolUser', builder => {
                builder.joinRelated('User')
                builder.select('SchoolUsers.sSchoolUserId AS sUserId', 'User.sName', 'User.sLastName',  'User.sSecondLastName', 'User.sEmail', 'User.sPhoneNumber');
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
                                    // Computed: iUsers count
                                    .select(db.raw(`
                                        (SELECT COUNT(*)::integer FROM "SchoolUsers" su
                                         JOIN "Users" u ON u."sUserId" = su."sSchoolUserId" AND u."bActive" = true
                                         WHERE su."sSchoolId" = "Schools"."sSchoolId"
                                        ) AS "iUsers"
                                    `))
                                    // Computed: iStudents count
                                    .select(db.raw(`
                                        (SELECT COUNT(*)::integer FROM "Students" st
                                         WHERE st."sSchoolId" = "Schools"."sSchoolId" AND st."bActive" = true
                                        ) AS "iStudents"
                                    `))
                                    // Computed: iGoals (active goals for students of this school)
                                    .select(db.raw(`
                                        (SELECT COUNT(*)::integer FROM "Goals" g
                                         JOIN "Students" s ON s."sStudentId" = g."sStudentId" AND s."bActive" = true
                                         WHERE s."sSchoolId" = "Schools"."sSchoolId" AND g."bActive" = true AND g."sStatus" = 'ACTIVE'
                                        ) AS "iGoals"
                                    `))
                                    // Computed: sGoalsProgress (AVG of active goals dProgress)
                                    .select(db.raw(`
                                        (SELECT COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0)::text FROM "Goals" g
                                         JOIN "Students" s ON s."sStudentId" = g."sStudentId" AND s."bActive" = true
                                         WHERE s."sSchoolId" = "Schools"."sSchoolId" AND g."bActive" = true AND g."sStatus" = 'ACTIVE'
                                        ) AS "sGoalsProgress"
                                    `))
                                    .where('Schools.bActive', true)
                                    .leftJoinRelated('City')
                                    .leftJoinRelated('City.State')
                                    .leftJoinRelated('City.State.Country')
                                    .withGraphFetched('SchoolUser')
                                    .modifyGraph('SchoolUser', builder => {
                                        builder.joinRelated('User')
                                        builder.select('SchoolUsers.sSchoolUserId AS sUserId', 'User.sName', 'User.sLastName',  'User.sSecondLastName', 'User.sEmail', 'User.sPhoneNumber');
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


    // Get comprehensive schools analytics data with date filtering
    static async findSchoolsAnalytics(tStartDate?, tEndDate?) {
        // Default date range: current month if not provided
        // Note: Joi.date() converts query params to JS Date objects, so we must convert back to YYYY-MM-DD strings
        const now = new Date();
        const sStart = tStartDate
            ? (tStartDate instanceof Date ? tStartDate.toISOString().split('T')[0] : String(tStartDate))
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const sEnd = tEndDate
            ? (tEndDate instanceof Date ? tEndDate.toISOString().split('T')[0] : String(tEndDate))
            : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Calculate previous period for trend comparison (same-length period immediately before)
        const startMs = new Date(sStart).getTime();
        const endMs = new Date(sEnd).getTime();
        const periodLength = endMs - startMs;
        const sPrevStart = new Date(startMs - periodLength).toISOString().split('T')[0];
        const sPrevEnd = new Date(startMs - 1).toISOString().split('T')[0]; // day before current start

        // Spanish month abbreviations
        const aMonthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        const [schoolsResult, studentsResult, goalProgressResult, usersResult, recentSchoolsResult, trendStudentsResult, trendGoalsResult, chartResult] = await Promise.all([

            // 1. School counts
            db.raw(`
                SELECT
                    COUNT(*)                                          ::integer AS "iTotalSchools",
                    COUNT(*) FILTER (WHERE "bBlocked" = false)       ::integer AS "iActiveSchools",
                    COUNT(*) FILTER (WHERE "bBlocked" = true)        ::integer AS "iInactiveSchools"
                FROM "Schools"
                WHERE "bActive" = true
            `),

            // 2. Total students and average per active school (filtered by date range)
            db.raw(`
                SELECT
                    COALESCE(SUM(sc_cnt.cnt), 0)                                     ::integer AS "iTotalStudents",
                    COALESCE(ROUND(AVG(COALESCE(sc_cnt.cnt, 0))::numeric, 1), 0)     ::float8  AS "dAvgStudents"
                FROM "Schools" sc
                LEFT JOIN (
                    SELECT "sSchoolId", COUNT("sStudentId") AS cnt
                    FROM "Students"
                    WHERE "bActive" = true
                      AND "created_at"::date BETWEEN ?::date AND ?::date
                    GROUP BY "sSchoolId"
                ) AS sc_cnt ON sc_cnt."sSchoolId" = sc."sSchoolId"
                WHERE sc."bActive" = true AND sc."bBlocked" = false
            `, [sStart, sEnd]),

            // 3. Goal progress: AVG(dProgress) across active goals created within date range
            db.raw(`
                SELECT
                    COALESCE(ROUND(AVG(g."dProgress")::numeric, 0), 0) ::integer AS "iGoalProgress"
                FROM "Goals" g
                JOIN "Students" s ON s."sStudentId" = g."sStudentId" AND s."bActive" = true
                JOIN "Schools" sc ON sc."sSchoolId" = s."sSchoolId" AND sc."bActive" = true
                WHERE g."bActive" = true AND g."sStatus" = 'ACTIVE'
                  AND g."created_at"::date BETWEEN ?::date AND ?::date
            `, [sStart, sEnd]),

            // 4. Average teachers and admin staff per active school
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

            // 5. 5 most recently created active schools
            db.raw(`
                SELECT
                    sc."sSchoolId",
                    sc."sName",
                    sc."bBlocked",
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

            // 6. Student trend: current period count vs previous period count
            db.raw(`
                SELECT
                    COALESCE((SELECT COUNT(*)::integer FROM "Students" WHERE "bActive" = true AND "created_at"::date BETWEEN ? AND ?), 0) AS "iCurrentStudents",
                    COALESCE((SELECT COUNT(*)::integer FROM "Students" WHERE "bActive" = true AND "created_at"::date BETWEEN ? AND ?), 0) AS "iPrevStudents"
            `, [sStart, sEnd, sPrevStart, sPrevEnd]),

            // 7. Goals trend: current period completion rate vs previous
            db.raw(`
                SELECT
                    COALESCE((SELECT ROUND(AVG("dProgress")::numeric, 1) FROM "Goals" WHERE "bActive" = true AND "sStatus" = 'ACTIVE' AND "created_at"::date BETWEEN ?::date AND ?::date), 0) ::float8 AS "dCurrentGoalProgress",
                    COALESCE((
                        SELECT COUNT(*)::integer FROM "Goals"
                        WHERE "bActive" = true AND "sStatus" = 'COMPLETED' AND "tCompletedDate" IS NOT NULL AND "tCompletedDate" BETWEEN ?::date AND ?::date
                    ), 0) AS "iCurrentCompleted",
                    COALESCE((
                        SELECT COUNT(*)::integer FROM "Goals"
                        WHERE "bActive" = true AND "sStatus" = 'COMPLETED' AND "tCompletedDate" IS NOT NULL AND "tCompletedDate" BETWEEN ?::date AND ?::date
                    ), 0) AS "iPrevCompleted"
            `, [sStart, sEnd, sStart, sEnd, sPrevStart, sPrevEnd]),

            // 8. Chart data: goals created and completed by month within date range
            db.raw(`
                SELECT
                    EXTRACT(MONTH FROM gs.month)::integer AS "iMonth",
                    COALESCE(created_cnt.cnt, 0)::integer AS "iCreated",
                    COALESCE(completed_cnt.cnt, 0)::integer AS "iCompleted"
                FROM generate_series(
                    date_trunc('month', ?::date),
                    date_trunc('month', ?::date),
                    '1 month'
                ) AS gs(month)
                LEFT JOIN (
                    SELECT date_trunc('month', "created_at") AS month, COUNT(*) AS cnt
                    FROM "Goals" WHERE "bActive" = true AND "created_at"::date BETWEEN ? AND ?
                    GROUP BY date_trunc('month', "created_at")
                ) AS created_cnt ON created_cnt.month = gs.month
                LEFT JOIN (
                    SELECT date_trunc('month', "tCompletedDate") AS month, COUNT(*) AS cnt
                    FROM "Goals" WHERE "bActive" = true AND "sStatus" = 'COMPLETED' AND "tCompletedDate" IS NOT NULL AND "tCompletedDate" BETWEEN ?::date AND ?::date
                    GROUP BY date_trunc('month', "tCompletedDate")
                ) AS completed_cnt ON completed_cnt.month = gs.month
                ORDER BY gs.month ASC
            `, [sStart, sEnd, sStart, sEnd, sStart, sEnd]),
        ]);

        // Parse results
        const schools  = schoolsResult.rows[0];
        const students = studentsResult.rows[0];
        const goalProgress = goalProgressResult.rows[0];
        const users    = usersResult.rows[0];
        const trendStudents = trendStudentsResult.rows[0];
        const trendGoals = trendGoalsResult.rows[0];

        // Calculate student trend
        const iCurrentStudents = parseInt(trendStudents?.iCurrentStudents ?? '0');
        const iPrevStudents = parseInt(trendStudents?.iPrevStudents ?? '0');
        let sStudentsTrend = '';
        if (iPrevStudents > 0) {
            const pct = ((iCurrentStudents - iPrevStudents) / iPrevStudents) * 100;
            sStudentsTrend = pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
        }

        // Calculate goals trend
        const iCurrentCompleted = parseInt(trendGoals?.iCurrentCompleted ?? '0');
        const iPrevCompleted = parseInt(trendGoals?.iPrevCompleted ?? '0');
        let sGoalsTrend = '';
        if (iPrevCompleted > 0) {
            const pct = ((iCurrentCompleted - iPrevCompleted) / iPrevCompleted) * 100;
            sGoalsTrend = pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
        }

        // Build chart data
        const chartRows = chartResult.rows;
        const aChartLabels = chartRows.map(r => aMonthNames[r.iMonth - 1]);
        const aGoalsTotalByMonth = chartRows.map(r => r.iCreated);
        const aGoalsCompletedByMonth = chartRows.map(r => r.iCompleted);

        return {
            iTotalSchools:    parseInt(schools?.iTotalSchools    ?? '0'),
            iActiveSchools:   parseInt(schools?.iActiveSchools   ?? '0'),
            iInactiveSchools: parseInt(schools?.iInactiveSchools ?? '0'),
            iTotalStudents:   parseInt(students?.iTotalStudents  ?? '0'),
            sStudentsTrend,
            iGoalProgress:    parseInt(goalProgress?.iGoalProgress ?? '0'),
            sGoalsTrend,
            dAvgStudents:     parseFloat(students?.dAvgStudents  ?? '0'),
            dAvgTeachers:     parseFloat(users?.dAvgTeachers   ?? '0'),
            dAvgAdminStaff:   parseFloat(users?.dAvgAdminStaff ?? '0'),
            aChartLabels,
            aGoalsTotalByMonth,
            aGoalsCompletedByMonth,
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
