/**
 * P7 — shared harness for the sequential-stage / own-title / average-window tests
 * (Lucy's feedback, 2026-08-17 and 2026-08-18).
 *
 * Same shape as the StripeSubscriptions harness — dependency-free, ordered, serial — but with its
 * own fixtures, because this suite needs a school with an ACTIVE student rather than a school with a
 * tariff. Kept self-contained on purpose so neither suite can break the other.
 *
 * Everything it creates is tracked and hard-deleted in teardown, and a residue check fails the run
 * if anything is left behind.
 */
require('dotenv').config();
import request from 'supertest';
import app from '../../App';
import { db } from '../../Config/Db.config';
import Services from '../../Services/Index.services';
import AuthServices from '../../Api/003_Authentication/authentication.services';
import SessionQueries from '../../Api/003_Authentication/002_Sessions/sessions.queries';

export { request, app, db };

/** Base path, derived the same way App.ts derives it, so this follows NODE_ENV. */
export const BASE: string = `${Services.GetEnvironment(process.env.NODE_ENV)}/api/v1/sp`;

/** Every goal this suite creates is titled with this prefix, so residue is easy to spot. */
export const TEST_PREFIX = 'ZZTEST-P7';

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
export const results = {
    pass: 0,
    fail: 0,
    skip: 0,
    failures: [] as string[]
};

let sCurrentFile = '';
export function setFile(s: string) { sCurrentFile = s; }

export function section(sName: string): void {
    console.log(`\n  ── ${sName}`);
}

export function check(sLabel: string, got: any, want: any): boolean {
    const bOk = String(got) === String(want);
    if (bOk) { results.pass++; console.log(`     PASS  ${sLabel}`); }
    else {
        results.fail++;
        results.failures.push(`${sCurrentFile} :: ${sLabel} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`);
        console.log(`     FAIL  ${sLabel}\n           got  ${JSON.stringify(got)}\n           want ${JSON.stringify(want)}`);
    }
    return bOk;
}

export function checkTrue(sLabel: string, bCond: any): boolean {
    return check(sLabel, !!bCond, true);
}

export function note(s: string): void {
    console.log(`           ${s}`);
}

// ---------------------------------------------------------------------------
// Safety guard
// ---------------------------------------------------------------------------

/**
 * Refuse to run anywhere except the development database. The suite inserts goals, subgoals and
 * tracking records and then hard-deletes them; `.env` has pointed at `production` before in this
 * project's history, so this check is not theoretical.
 */
export async function assertSafeDatabase(): Promise<void> {
    const oRow = await db.raw('select current_database() as db');
    const sDb = oRow.rows[0].db;
    if (sDb !== 'development') {
        throw new Error(
            `REFUSING TO RUN: connected to database "${sDb}". These tests write data and only run ` +
            `against "development". Check DB_NAME in .env.`
        );
    }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
export interface IFixture {
    sSchoolId: string;
    sMainUserId: string;
    sStudentId: string;
    sStudentName: string;
}

/**
 * A school with a MAIN user (Users.sCreatedBy IS NULL) that also has an ACTIVE student.
 *
 * The student must be active: every goal aggregate joins Students and filters on `bActive`, so a
 * goal belonging to an inactive student silently drops out of the queries under test — a trap that
 * already produced one invalid test result in this project.
 */
export async function pickFixture(): Promise<IFixture> {
    const oRow = await db.raw(`
        select su."sSchoolId",
               u."sUserId"     as main_id,
               st."sStudentId" as student_id,
               concat_ws(' ', st."sName", st."sLastName") as student_name
        from myvillageschema."SchoolUsers" su
        join myvillageschema."Users"    u  on u."sUserId"    = su."sSchoolUserId"
                                          and u."bActive" and u."sCreatedBy" is null
        join myvillageschema."Schools"  s  on s."sSchoolId"  = su."sSchoolId"
                                          and s."bActive" and s."bBlocked" = false
                                          and coalesce(s."sBillingStatus", 'NONE') <> 'SUSPENDED'
        join myvillageschema."Students" st on st."sSchoolId" = su."sSchoolId" and st."bActive"
        limit 1`);
    if (!oRow.rows.length) {
        throw new Error('No school with a main user AND an active student found in the development database.');
    }
    return {
        sSchoolId: oRow.rows[0].sSchoolId,
        sMainUserId: oRow.rows[0].main_id,
        sStudentId: oRow.rows[0].student_id,
        sStudentName: oRow.rows[0].student_name
    };
}

const aMintedSessions: string[] = [];

/** A genuine bearer token, minted through the app's own token code — no password needed. */
export async function mintAuth(sUserId: string): Promise<{ Authorization: string }> {
    const tExpiresAt = await AuthServices.getExpireToken(new Date(), 60);
    const oSession = await SessionQueries.insertSession({ sUserId, tExpiresAt });
    aMintedSessions.push(oSession.sSessionId);
    const sToken = await AuthServices.createToken({ sUserId, sSessionId: oSession.sSessionId });
    return { Authorization: `Bearer ${sToken}` };
}

export async function releaseSessions(): Promise<void> {
    for (const sId of aMintedSessions) {
        await db.raw('delete from myvillageschema."Sessions" where "sSessionId" = ?', [sId]).catch(() => {});
    }
    aMintedSessions.length = 0;
}

// ---------------------------------------------------------------------------
// Created-row tracking + teardown
// ---------------------------------------------------------------------------
const aCreatedGoals: string[] = [];

/** Track a goal or subgoal id so teardown removes it. */
export function trackGoal(sGoalId?: string | null): void {
    if (sGoalId && !aCreatedGoals.includes(sGoalId)) aCreatedGoals.push(sGoalId);
}

/**
 * Hard-delete everything the suite created: records first (FK), then subgoals, then the goals.
 * Soft-deleting would leave rows behind that the next run's residue check would flag.
 */
export async function releaseGoals(): Promise<number> {
    if (!aCreatedGoals.length) return 0;
    const aIds = [...aCreatedGoals];

    // Children of tracked goals, including any the suite did not track directly.
    const oChildren = await db.raw(
        `select "sGoalId" from myvillageschema."Goals" where "sParentGoalId" = any(?)`, [aIds]);
    const aAll = [...new Set([...aIds, ...oChildren.rows.map((r: any) => r.sGoalId)])];

    await db.raw(`delete from myvillageschema."TrackingRecordTasks" where "sTrackingRecordId" in (
                     select "sTrackingRecordId" from myvillageschema."TrackingRecords"
                     where "sGoalId" = any(?))`, [aAll]).catch(() => {});
    await db.raw(`delete from myvillageschema."TrackingRecords" where "sGoalId" = any(?)`, [aAll]).catch(() => {});
    await db.raw(`delete from myvillageschema."GoalTasks" where "sGoalId" = any(?)`, [aAll]).catch(() => {});
    // Children before parents — sParentGoalId is a real FK.
    await db.raw(`delete from myvillageschema."Goals" where "sParentGoalId" = any(?)`, [aAll]).catch(() => {});
    await db.raw(`delete from myvillageschema."Goals" where "sGoalId" = any(?)`, [aAll]).catch(() => {});

    aCreatedGoals.length = 0;
    return aAll.length;
}

/** Any leftover row from this or an earlier run. Must be zero at the end. */
export async function countResidue(): Promise<number> {
    const oRow = await db.raw(
        `select count(*)::int as n from myvillageschema."Goals" where "sTitle" like ?`, [`${TEST_PREFIX}%`]);
    return oRow.rows[0].n;
}

// ---------------------------------------------------------------------------
// Reading the stored figures directly — the columns every screen actually reads
// ---------------------------------------------------------------------------
export async function readGoalRow(sGoalId: string): Promise<any> {
    const oRow = await db.raw(
        `select "sGoalId", "sTitle", "sStatus", "sParentGoalId", "bHasSubGoals", "dProgress",
                "dAverageValue", "iRecordsCount", "tLastRecord"
         from myvillageschema."Goals" where "sGoalId" = ?`, [sGoalId]);
    return oRow.rows[0];
}

/**
 * The goal's stages, in the order the sequential machine walks them. `sStatus` is essential here:
 * omitting it once made four assertions read `undefined` and one of them pass by accident.
 */
export async function readSubGoalRows(sParentGoalId: string): Promise<any[]> {
    const oRows = await db.raw(
        `select "sGoalId", "sTitle", "sStatus", "iOrder", "dProgress", "iRecordsCount"
         from myvillageschema."Goals"
         where "sParentGoalId" = ? and "bActive" = true
         order by "iOrder" asc, "created_at" asc`, [sParentGoalId]);
    return oRows.rows;
}

/** Round to 2 decimals the same way the rollup does, so comparisons are exact. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** A YYYY-MM-DD date `iDaysAgo` days before today, in local time. */
export function isoDay(iDaysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - iDaysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
