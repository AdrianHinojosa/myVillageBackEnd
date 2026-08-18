/**
 * The exact fields the FRONTEND reads — pinned so a refactor here cannot silently break it.
 *
 * Every assertion in this file exists because a specific line of frontend code depends on it. The
 * other files in this suite check business rules by reading the database directly, which means they
 * would all still pass if a response envelope or a field name changed. That gap is real: three of
 * these fields were shipped and wired into the frontend before anything asserted they were actually
 * on the wire.
 *
 *   sStatus on GET /goals/:id/subGoals   → app/utils/subGoals.ts getCurrentSubGoal(), and
 *                                          [subGoalId].vue bCanCapture — the whole sequential UI
 *   sSubGoalId                           → the key the frontend uses for every subgoal
 *   dProgress on GET /goals/:id          → SubGoalsManager.vue dOverallProgress
 *   aHelpTypes on the student report     → students/[id]/index.vue, after dropping its N+1 patch
 *   sSubGoalTitle on the report          → lets the PDF label a row with its stage
 *   bIsMainUser in the login payload     → auth.ts bCanManageBilling, which gates the billing panel
 */
import {
    request, app, db, BASE, TEST_PREFIX,
    section, check, checkTrue, note, setFile,
    pickFixture, mintAuth, trackGoal, isoDay
} from './helpers';

export default async function run(): Promise<void> {
    setFile('05_frontendContract');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);

    // ---------------------------------------------------------------------
    section('a divided goal with two stages, one record with a help type');
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} contract`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    if (!sGoalId) return;

    for (const sTitle of ['Stage A', 'Stage B']) {
        const oSub = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth)
            .send({ sTitle, iTargetValue: 100 });
        check(`POST subGoal "${sTitle}" -> 201`, oSub.status, 201);
        trackGoal((oSub.body?.oData || {}).sSubGoalId);
    }

    // ---------------------------------------------------------------------
    section('GET /goals/:id/subGoals — the fields the sequential UI is built on');
    const oList = await request(app).get(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth);
    check('-> 200', oList.status, 200);
    const aData = oList.body?.aData || [];
    checkTrue('envelope is aData', Array.isArray(aData) && aData.length === 2);
    check('[0].sStatus is ACTIVE', aData[0]?.sStatus, 'ACTIVE');
    check('[1].sStatus is PAUSED', aData[1]?.sStatus, 'PAUSED');
    check('exactly one ACTIVE in the RESPONSE, not just in the table',
        aData.filter((o: any) => o.sStatus === 'ACTIVE').length, 1);
    check('sSubGoalId is a string', typeof aData[0]?.sSubGoalId, 'string');
    check('sTitle is the subgoal\'s own', aData[0]?.sTitle, 'Stage A');
    checkTrue('iOrder present, so the queue can be rendered in order', aData[0]?.iOrder !== undefined);

    const sStageId = aData[0].sSubGoalId;

    // ---------------------------------------------------------------------
    section('GET /goals/:id — dProgress is what the goal card reads');
    await request(app).post(`${BASE}/trackingRecords`).set(oAuth).send({
        sSubGoalId: sStageId,
        dtDate: isoDay(0),
        iCorrect: 8,
        iTotal: 10,
        aHelpTypes: [{ sHelpType: 'visual', iHelpAmount: 7 }]
    });
    const oGet = await request(app).get(`${BASE}/goals/${sGoalId}`).set(oAuth);
    check('-> 201', oGet.status, 201);
    check('dProgress mirrors the stage in progress (80)', Number(oGet.body?.goal?.dProgress), 80);
    check('bHasSubGoals is on the wire', oGet.body?.goal?.bHasSubGoals, true);

    // ---------------------------------------------------------------------
    section('GET /students/:id/report — aHelpTypes, so the frontend needs no second fetch');
    const oRep = await request(app)
        .get(`${BASE}/students/${oFix.sStudentId}/report?tStartDate=${isoDay(7)}&tEndDate=${isoDay(0)}`)
        .set(oAuth);
    check('-> 200', oRep.status, 200);
    const oReported = (oRep.body?.oData?.aGoals || []).find((g: any) => g.sGoalId === sGoalId);
    checkTrue('the divided goal is in the report', !!oReported);
    const oRecord = (oReported?.aRecords || [])[0];
    checkTrue('aHelpTypes is an array', Array.isArray(oRecord?.aHelpTypes));
    check('carrying the slug the frontend expects (lowercase)', oRecord?.aHelpTypes?.[0]?.sHelpType, 'visual');
    check('and its 0-10 value', Number(oRecord?.aHelpTypes?.[0]?.iHelpAmount), 7);
    check('sSubGoalTitle names the stage', oRecord?.sSubGoalTitle, 'Stage A');
    check('sSubGoalId names the stage', oRecord?.sSubGoalId, sStageId);
    note('the frontend dropped an N+1 patch that fetched /goals/:id/trackingRecords per goal for this');

    // ---------------------------------------------------------------------
    /**
     * `bIsMainUser` in the login payload.
     *
     * Checked structurally rather than over HTTP: `POST /auth/login` needs a real password, and this
     * suite deliberately never handles credentials — it mints tokens through `AuthServices` instead.
     * So the two things that could silently break are asserted directly: that the field sits at the
     * root of `results` (moving it into `oSchool` would make the frontend read `undefined`, which
     * reads as "not the main user" and hides the billing panel from everyone), and that it is derived
     * from `sCreatedBy`.
     */
    section('login payload — bIsMainUser (structural check, see the note in the source)');
    const sSource = require('fs').readFileSync(
        'src/Api/003_Authentication/authentication.controllers.ts', 'utf8');
    checkTrue('bIsMainUser is inside the `results` object',
        /const results: any = \{[\s\S]*?bIsMainUser,[\s\S]*?\};/.test(sSource));
    checkTrue('and derived from Users.sCreatedBy',
        /bIsMainUser = User\.sCreatedBy === null/.test(sSource));

    const oMain = await db.raw(
        `select "sCreatedBy" from myvillageschema."Users" where "sUserId" = ?`, [oFix.sMainUserId]);
    check('the fixture really is a main user (sCreatedBy null)', oMain.rows[0]?.sCreatedBy, null);
}
