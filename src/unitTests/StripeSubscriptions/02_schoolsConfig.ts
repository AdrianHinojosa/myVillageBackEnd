/**
 * Tariff configuration, the login payload and the suspension gate.
 *
 * Database + HTTP, but NO Stripe — so this file runs even with no Stripe key configured.
 */
import {
    section, check, setFile, note, request, app, db, BASE,
    pickFixture, mintAuth, snapshotSchool, restoreSchool, setTariff, readSchool
} from './helpers';

export default async function run(): Promise<void> {
    setFile('02_schoolsConfig');
    const oFix = await pickFixture();
    const oSnap = await snapshotSchool(oFix.sSchoolId);
    const oMain = await mintAuth(oFix.sMainUserId);
    const oAdmin = oFix.sAdminUserId ? await mintAuth(oFix.sAdminUserId) : null;

    try {
        section('login exposes sBillingStatus for the frontend gate');
        await setTariff(oFix.sSchoolId, { sBillingMode: 'FIXED', dFixedAmount: 10000 });
        // Read it off the school rather than logging in, so no password is touched.
        const oRow = await readSchool(oFix.sSchoolId);
        check('defaults to NONE', oRow.sBillingStatus, 'NONE');

        if (oAdmin) {
            section('superadmin can set a tariff via PUT /schools');
            const oPut = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
                sName: oSnap.sName, iUsersLimit: 10, iStudentsLimit: 40,
                sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200, dDiscountPct: 10
            });
            check('-> 201', oPut.status, 201);
            const o2 = await readSchool(oFix.sSchoolId);
            check('sBillingMode saved', o2.sBillingMode, 'VARIABLE');
            check('dAmountPerTeacher saved', Number(o2.dAmountPerTeacher), 500);
            check('dAmountPerStudent saved', Number(o2.dAmountPerStudent), 200);
            check('dDiscountPct saved', Number(o2.dDiscountPct), 10);
            check('sBillingStatus untouched by a tariff edit', o2.sBillingStatus, 'NONE');

            section('omitting tariff fields PRESERVES them (no silent wipe)');
            await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin).send({
                sName: oSnap.sName, iUsersLimit: 10, iStudentsLimit: 40
            });
            const o3 = await readSchool(oFix.sSchoolId);
            check('mode preserved', o3.sBillingMode, 'VARIABLE');
            check('amount preserved', Number(o3.dAmountPerTeacher), 500);

            section('invalid tariff values are refused cleanly, never a 500');
            const oBadMode = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin)
                .send({ sName: 'x', iUsersLimit: 1, iStudentsLimit: 1, sBillingMode: 'MONTHLY' });
            check('bad sBillingMode -> 409', oBadMode.status, 409);
            check('  and not a 500', oBadMode.status !== 500, true);
            note(`message: ${oBadMode.body?.message}`);
            const oBadPct = await request(app).put(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin)
                .send({ sName: 'x', iUsersLimit: 1, iStudentsLimit: 1, dDiscountPct: 150 });
            check('discount 150 -> 409', oBadPct.status, 409);

            section('GET /schools/:id returns the tariff and the status');
            const oGet = await request(app).get(`${BASE}/schools/${oFix.sSchoolId}`).set(oAdmin);
            check('-> 201', oGet.status, 201);
            check('sBillingMode returned', 'sBillingMode' in (oGet.body?.school || {}), true);
            check('sBillingStatus returned', 'sBillingStatus' in (oGet.body?.school || {}), true);
        }

        section('SUSPENDED blocks every user of the school — no grace period');
        await setTariff(oFix.sSchoolId, { sBillingMode: 'FIXED', dFixedAmount: 10000 });
        const oBefore = await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 });
        check('NONE -> access allowed', oBefore.status, 201);

        await db.raw(`update myvillageschema."Schools" set "sBillingStatus" = 'SUSPENDED' where "sSchoolId" = ?`, [oFix.sSchoolId]);
        const oBlocked = await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 });
        check('SUSPENDED -> 402 Payment Required', oBlocked.status, 402);
        note(`message: ${oBlocked.body?.message}`);

        section('support tickets stay reachable while suspended — the only way out');
        const oTicket = await request(app).post(`${BASE}/support/ticket`).set(oMain)
            .send({ sSubject: 'Suspendido', sMessage: 'No puedo entrar a la plataforma.' });
        check('POST /support/ticket -> 200', oTicket.status, 200);

        section('the other five statuses do NOT block');
        for (const sStatus of ['NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED']) {
            await db.raw(`update myvillageschema."Schools" set "sBillingStatus" = ? where "sSchoolId" = ?`, [sStatus, oFix.sSchoolId]);
            const oRes = await request(app).get(`${BASE}/students`).set(oMain).query({ iPageNumber: 1, iItemsPerPage: 2 });
            check(`${sStatus} -> allowed`, oRes.status, 201);
        }
    } finally {
        await restoreSchool(oFix.sSchoolId, oSnap);
    }
}
