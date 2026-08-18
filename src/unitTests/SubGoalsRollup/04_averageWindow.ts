/**
 * How a goal's percentage is calculated — the WHOLE history is averaged, not the last 3 records.
 *
 * Rule set by the client (Lucy, 2026-08-18): *"se promedia toda la submeta"* — average the whole subgoal.
 *
 * This replaces a rule that had been in place since the original system and is documented in the
 * frontend's `docs/REGLAS_DE_NEGOCIO.md` §7.4 (*"Default: Últimos 3 registros"*) and §13.2. The PO
 * confirmed it applies to **goals and subgoals alike**, so there is one window everywhere.
 *
 * The test is built so the two rules give DIFFERENT answers and only one can pass:
 *
 *   4 records, newest first: 100%, 100%, 100%, 0%
 *     last-3 rule → (100+100+100)/3 = 100%
 *     all-records → (100+100+100+0)/4 =  75%   ← must be this
 *
 * The excluded-record escape hatch is checked too, since it is now the only way to keep a bad day
 * out of the number.
 */
import {
    request, app, BASE, TEST_PREFIX,
    section, check, note, setFile,
    pickFixture, mintAuth, trackGoal, readGoalRow, isoDay
} from './helpers';

export default async function run(): Promise<void> {
    setFile('04_averageWindow');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);

    // ---------------------------------------------------------------------
    section('an ordinary goal (no subgoals) — the rule is the same for both');
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} window`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    if (!sGoalId) return;

    // Oldest first so `dtDate` ordering is unambiguous: day 3 is the bad one.
    const aRecordIds: string[] = [];
    const aPlan = [
        { iDaysAgo: 3, iCorrect: 0,  sLabel: '3 days ago  0/10 =   0%' },
        { iDaysAgo: 2, iCorrect: 10, sLabel: '2 days ago 10/10 = 100%' },
        { iDaysAgo: 1, iCorrect: 10, sLabel: 'yesterday  10/10 = 100%' },
        { iDaysAgo: 0, iCorrect: 10, sLabel: 'today      10/10 = 100%' },
    ];
    for (const oPlan of aPlan) {
        const oRes = await request(app).post(`${BASE}/trackingRecords`).set(oAuth).send({
            sGoalId, dtDate: isoDay(oPlan.iDaysAgo), iCorrect: oPlan.iCorrect, iTotal: 10
        });
        check(`${oPlan.sLabel} -> 201`, oRes.status, 201);
        aRecordIds.push(oRes.body?.oData?.sTrackingRecordId);
    }

    section('the bad first day still counts');
    const dProgress = Number((await readGoalRow(sGoalId)).dProgress);
    note('last-3 rule would say 100%, all-records says 75%');
    check('dProgress = 75% (all four records)', dProgress, 75);
    check('...and NOT 100% (the newest three)', dProgress === 100, false);
    check('iRecordsCount = 4', Number((await readGoalRow(sGoalId)).iRecordsCount), 4);

    // ---------------------------------------------------------------------
    section('excluding a record is now the only way to drop an outlier');
    const sBadRecordId = aRecordIds[0];
    if (!sBadRecordId) {
        note('could not read the record id from the create response — skipping the exclusion check');
    } else {
        const oExclude = await request(app)
            .patch(`${BASE}/trackingRecords/${sBadRecordId}/toggleExclusion`).set(oAuth)
            .send({ bExcludedFromAverage: true });
        check('PATCH toggleExclusion -> 200', oExclude.status, 200);
        check('excluding the 0% day lifts the goal to 100%', Number((await readGoalRow(sGoalId)).dProgress), 100);
        check('but it is still in the history (iRecordsCount stays 4)',
            Number((await readGoalRow(sGoalId)).iRecordsCount), 4);
    }

    // ---------------------------------------------------------------------
    section('a subgoal behaves identically — one rule for the whole system');
    const oParent = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} window subgoal`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    const sParentId = oParent.body?.goal?.sGoalId;
    trackGoal(sParentId);
    const oSub = await request(app).post(`${BASE}/goals/${sParentId}/subGoals`).set(oAuth)
        .send({ sTitle: 'Only stage', iTargetValue: 100 });
    const sSubId = (oSub.body?.oData || {}).sSubGoalId;
    trackGoal(sSubId);

    for (const oPlan of aPlan) {
        await request(app).post(`${BASE}/trackingRecords`).set(oAuth).send({
            sSubGoalId: sSubId, dtDate: isoDay(oPlan.iDaysAgo), iCorrect: oPlan.iCorrect, iTotal: 10
        });
    }
    check('the stage is at 75%, same as the goal was', Number((await readGoalRow(sSubId)).dProgress), 75);
    check('and the goal mirrors it', Number((await readGoalRow(sParentId)).dProgress), 75);
}
