/**
 * Punto 3 — shared harness for the billing / Stripe subscription tests.
 *
 * Deliberately dependency-free (no jest): these are integration tests that drive the REAL Express
 * app against the REAL development database and the REAL Stripe sandbox, so they need ordered,
 * serial execution and guaranteed teardown — which a plain runner gives more predictably than a
 * parallel test framework.
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
/** The webhook sits outside the :sLang segment. */
export const WEBHOOK_PATH: string = `${Services.GetEnvironment(process.env.NODE_ENV)}/api/v1/billing/webhook`;

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

export function skip(sLabel: string, sReason: string): void {
    results.skip++;
    console.log(`     SKIP  ${sLabel}  (${sReason})`);
}

export function note(s: string): void {
    console.log(`           ${s}`);
}

// ---------------------------------------------------------------------------
// Safety guards — these tests MUTATE school rows and create Stripe objects
// ---------------------------------------------------------------------------

/**
 * Refuse to run anywhere except the development database.
 *
 * The suite patches tariffs, flips sBillingStatus (including SUSPENDED, which locks users out) and
 * inserts payment rows. Running that against production would be damaging, and `.env` has pointed at
 * `production` before in this project's history, so this check is not theoretical.
 */
export async function assertSafeDatabase(): Promise<void> {
    const oRow = await db.raw('select current_database() as db');
    const sDb = oRow.rows[0].db;
    if (sDb !== 'development') {
        throw new Error(
            `REFUSING TO RUN: connected to database "${sDb}". These tests mutate data and only run ` +
            `against "development". Check DB_NAME in .env.`
        );
    }
}

/** Refuse to run against a LIVE Stripe key — the suite creates subscriptions and charges. */
export function assertSafeStripe(): void {
    const sKey = process.env.STRIPE_PRIVATE_KEY || '';
    if (sKey.startsWith('sk_live_')) {
        throw new Error('REFUSING TO RUN: STRIPE_PRIVATE_KEY is a LIVE key. These tests must only run in test mode.');
    }
}

/** Is a usable test-mode Stripe key present? Stripe-dependent files skip themselves without one. */
export function hasStripe(): boolean {
    const sKey = process.env.STRIPE_PRIVATE_KEY || '';
    return sKey.startsWith('sk_test_') && sKey.length > 20;
}

/**
 * A webhook secret for signature tests.
 *
 * If the environment has none, a local one is generated for this process only. That still exercises
 * the real verification path, because the payloads are signed with Stripe's own
 * `webhooks.generateTestHeaderString` using this same secret.
 */
export function ensureWebhookSecret(): string {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_unittest_' + 'k'.repeat(32);
    }
    return process.env.STRIPE_WEBHOOK_SECRET as string;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
export interface IFixture {
    sSchoolId: string;
    sMainUserId: string;
    sOtherUserId: string | null;
    sAdminUserId: string | null;
}

/** Everything this suite creates is tagged with this, so residue is unmistakable. */
export const FIXTURE_TAG = 'ZZTEST-STRIPE';

/**
 * A school created by and for this suite, then destroyed.
 *
 * It used to pick the FIRST real school with a main user and mutate its billing columns, restoring
 * them afterwards. That stopped being safe the moment a Stripe webhook endpoint went live: the
 * deployed dev API receives real Stripe events and writes to this same `development` database, so a
 * webhook for a school someone was testing by hand could land mid-run and overwrite the very column
 * an assertion was about. That is exactly what happened — `sBillingStatus` flipped from TRIALING to
 * ACTIVE between two reads, with no code in this process having written it.
 *
 * A dedicated school removes that class of collision: no human is clicking through it, and nothing
 * else in the database references it.
 *
 * The rows are created directly rather than through the API because `POST /schools` sends an
 * invitation email and requires a superadmin token — neither of which belongs in a fixture.
 */
export async function pickFixture(): Promise<IFixture> {
    // Each file gets its own school. Cleanup is the runner's job, at the start AND the end of the
    // run — doing it here would delete the previous file's school while its Stripe objects still
    // pointed at it.
    const sSuffix = Math.random().toString(36).slice(2, 10);

    const oSchool = await db.raw(`
        insert into myvillageschema."Schools"
            ("sName", "sEmail", "sPhone", "iUsersLimit", "iStudentsLimit", "bBlocked", "bActive")
        values (?, ?, '+520000000000', 10, 40, false, true)
        returning "sSchoolId"`,
        [`${FIXTURE_TAG} school ${sSuffix}`, `${FIXTURE_TAG.toLowerCase()}-${sSuffix}@example.invalid`]);
    const sSchoolId: string = oSchool.rows[0].sSchoolId;

    // The MAIN user is defined by sCreatedBy IS NULL — that is what the billing guards check.
    const oMain = await db.raw(`
        insert into myvillageschema."Users"
            ("sName", "sLastName", "sEmail", "sType", "bPlatformAccess", "bVerified", "sCreatedBy", "bActive")
        values (?, 'Main', ?, 'ADMINISTRATION', true, true, null, true)
        returning "sUserId"`,
        [`${FIXTURE_TAG}`, `${FIXTURE_TAG.toLowerCase()}-main-${sSuffix}@example.invalid`]);
    const sMainUserId: string = oMain.rows[0].sUserId;

    // A SECOND administrative user, so the "only the main user may mutate" 403 can be proven.
    const oOther = await db.raw(`
        insert into myvillageschema."Users"
            ("sName", "sLastName", "sEmail", "sType", "bPlatformAccess", "bVerified", "sCreatedBy", "bActive")
        values (?, 'Second', ?, 'ADMINISTRATION', true, true, ?, true)
        returning "sUserId"`,
        [`${FIXTURE_TAG}`, `${FIXTURE_TAG.toLowerCase()}-second-${sSuffix}@example.invalid`, sMainUserId]);
    const sOtherUserId: string = oOther.rows[0].sUserId;

    for (const sUserId of [sMainUserId, sOtherUserId]) {
        await db.raw(`insert into myvillageschema."SchoolUsers" ("sSchoolUserId", "sSchoolId") values (?, ?)`,
            [sUserId, sSchoolId]);
    }

    // The superadmin is only used to mint a token for PUT /schools, so an existing one is fine —
    // nothing about it is mutated.
    const oAdmin = await db.raw(`
        select u."sUserId" from myvillageschema."Users" u
        join myvillageschema."Administrators" a on a."sAdministratorId" = u."sUserId"
        where u."bActive" limit 1`);

    return {
        sSchoolId,
        sMainUserId,
        sOtherUserId,
        sAdminUserId: oAdmin.rows.length ? oAdmin.rows[0].sUserId : null
    };
}

/** Remove every fixture row this suite has ever created. Safe to call before and after a run. */
export async function destroyFixtures(): Promise<number> {
    const oSchools = await db.raw(
        `select "sSchoolId" from myvillageschema."Schools" where "sName" like ?`, [`${FIXTURE_TAG}%`]);
    const aSchoolIds = oSchools.rows.map((r: any) => r.sSchoolId);

    const oUsers = await db.raw(
        `select "sUserId" from myvillageschema."Users" where "sName" like ?`, [`${FIXTURE_TAG}%`]);
    const aUserIds = oUsers.rows.map((r: any) => r.sUserId);

    if (aUserIds.length) {
        await db.raw(`delete from myvillageschema."Sessions" where "sUserId" = any(?)`, [aUserIds]).catch(() => {});
    }
    if (aSchoolIds.length) {
        await db.raw(`delete from myvillageschema."Payments" where "sSchoolId" = any(?)`, [aSchoolIds]).catch(() => {});
        await db.raw(`delete from myvillageschema."SchoolUsers" where "sSchoolId" = any(?)`, [aSchoolIds]).catch(() => {});
    }
    if (aUserIds.length) {
        // Children before parents: the second user references the main one via sCreatedBy.
        await db.raw(`update myvillageschema."Users" set "sCreatedBy" = null where "sUserId" = any(?)`, [aUserIds]).catch(() => {});
        await db.raw(`delete from myvillageschema."Users" where "sUserId" = any(?)`, [aUserIds]).catch(() => {});
    }
    if (aSchoolIds.length) {
        await db.raw(`delete from myvillageschema."Schools" where "sSchoolId" = any(?)`, [aSchoolIds]).catch(() => {});
    }
    return aSchoolIds.length;
}

/** Fixture rows still present. Must be zero once the runner has torn down. */
export async function countFixtureResidue(): Promise<number> {
    const oRow = await db.raw(
        `select (select count(*) from myvillageschema."Schools" where "sName" like ?)
              + (select count(*) from myvillageschema."Users"   where "sName" like ?) as n`,
        [`${FIXTURE_TAG}%`, `${FIXTURE_TAG}%`]);
    return Number(oRow.rows[0].n);
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

/** Every school column, so the row can be put back exactly as found. */
export async function snapshotSchool(sSchoolId: string): Promise<any> {
    const oRow = await db.raw('select * from myvillageschema."Schools" where "sSchoolId" = ?', [sSchoolId]);
    return oRow.rows[0];
}

const BILLING_COLUMNS = [
    'sBillingMode', 'dFixedAmount', 'dAmountPerTeacher', 'dAmountPerStudent', 'dDiscountPct',
    'sBillingStatus', 'sStripeCustomerId', 'sStripeSubscriptionId', 'sStripePriceId',
    'tCurrentPeriodEnd', 'bCancelAtPeriodEnd', 'iFailedAttempts',
    'iUsersLimit', 'iStudentsLimit', 'sAccountType'
];

export async function restoreSchool(sSchoolId: string, oSnapshot: any): Promise<void> {
    if (!oSnapshot) return;
    const aSet = BILLING_COLUMNS.map(c => `"${c}" = ?`).join(', ');
    const aVals = BILLING_COLUMNS.map(c => oSnapshot[c]);
    await db.raw(`update myvillageschema."Schools" set ${aSet} where "sSchoolId" = ?`, [...aVals, sSchoolId]);
}

/** Give the school a known tariff and a clean billing slate. */
export async function setTariff(sSchoolId: string, oCfg: any): Promise<void> {
    await db.raw(`update myvillageschema."Schools" set
        "sBillingMode" = ?, "dFixedAmount" = ?, "dAmountPerTeacher" = ?, "dAmountPerStudent" = ?,
        "dDiscountPct" = ?, "iUsersLimit" = ?, "iStudentsLimit" = ?,
        "sBillingStatus" = 'NONE', "sStripeCustomerId" = null, "sStripeSubscriptionId" = null,
        "sStripePriceId" = null, "tCurrentPeriodEnd" = null, "bCancelAtPeriodEnd" = false,
        "iFailedAttempts" = 0
        where "sSchoolId" = ?`,
        [oCfg.sBillingMode ?? 'FIXED', oCfg.dFixedAmount ?? null, oCfg.dAmountPerTeacher ?? null,
         oCfg.dAmountPerStudent ?? null, oCfg.dDiscountPct ?? null,
         oCfg.iUsersLimit ?? 10, oCfg.iStudentsLimit ?? 40, sSchoolId]);
}

export async function readSchool(sSchoolId: string): Promise<any> {
    const oRow = await db.raw('select * from myvillageschema."Schools" where "sSchoolId" = ?', [sSchoolId]);
    return oRow.rows[0];
}

export async function deletePaymentsFor(sSchoolId: string): Promise<void> {
    await db.raw('delete from myvillageschema."Payments" where "sSchoolId" = ?', [sSchoolId]).catch(() => {});
}

// ---------------------------------------------------------------------------
// Stripe object cleanup
// ---------------------------------------------------------------------------
const aStripeCustomers: string[] = [];
const aStripeSubs: string[] = [];
const aStripeClocks: string[] = [];

export function trackCustomer(id?: string | null) { if (id) aStripeCustomers.push(id); }
export function trackSubscription(id?: string | null) { if (id) aStripeSubs.push(id); }
export function trackClock(id?: string | null) { if (id) aStripeClocks.push(id); }

/** Remove everything the suite created in the Stripe sandbox. */
export async function releaseStripe(stripe: any): Promise<{ subs: number, customers: number, clocks: number }> {
    let subs = 0, customers = 0, clocks = 0;
    for (const id of aStripeSubs)      { try { await stripe.subscriptions.del(id); subs++; } catch {} }
    for (const id of aStripeCustomers) { try { await stripe.customers.del(id); customers++; } catch {} }
    for (const id of aStripeClocks)    { try { await stripe.testHelpers.testClocks.del(id); clocks++; } catch {} }
    aStripeSubs.length = 0; aStripeCustomers.length = 0; aStripeClocks.length = 0;
    return { subs, customers, clocks };
}

export const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/** Poll until a condition holds — test clocks settle asynchronously. */
export async function waitFor(fn: () => Promise<boolean>, iTries = 40, iDelayMs = 3000): Promise<boolean> {
    for (let i = 0; i < iTries; i++) {
        if (await fn()) return true;
        await new Promise(r => setTimeout(r, iDelayMs));
    }
    return false;
}
