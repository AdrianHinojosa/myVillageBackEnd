/**
 * Punto 7 — el reporte del alumno cuenta los registros de las submetas.
 *
 * Lucy's report: the progress report said "no hay metas" for a divided goal.
 *
 * Cause: `GET /students/:id/report` fetched records with `whereIn('sGoalId', <top-level goal ids>)`.
 * A subgoal's records carry the SUBGOAL's id, so nothing was found — and because the report keeps
 * only goals that have records, the divided goal did not come back at 0%, it disappeared entirely.
 *
 * Under test: the goal is present, its card carries every record logged across its stages, each
 * record says which stage it came from, and the report's average progress uses the rolled-up figure.
 */
import {
    request, app, db, BASE, TEST_PREFIX,
    section, check, checkTrue, note, setFile,
    pickFixture, mintAuth, trackGoal, readGoalRow, isoDay
} from './helpers';

/** Records physically attached to this goal id — a divided goal must have none. */
async function ownRecordCount(sGoalId: string): Promise<number> {
    const oRow = await db.raw(
        `select count(*)::int as n from myvillageschema."TrackingRecords"
         where "sGoalId" = ? and "bActive" = true`, [sGoalId]);
    return oRow.rows[0].n;
}

export default async function run(): Promise<void> {
    setFile('03_studentReport');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);

    // ---------------------------------------------------------------------
    section('a divided goal whose only records live in its stages');
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} reporte`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    if (!sGoalId) return;

    const sStageTitle = 'Etapa 1 — comprensión';
    const oSub = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth)
        .send({ sTitle: sStageTitle, iTargetValue: 100 });
    check('POST subGoal -> 201', oSub.status, 201);
    const sSubGoalId = (oSub.body?.oData || {}).sSubGoalId;
    trackGoal(sSubGoalId);

    for (let i = 0; i < 2; i++) {
        const oRec = await request(app).post(`${BASE}/trackingRecords`).set(oAuth)
            .send({ sSubGoalId, dtDate: isoDay(i), iCorrect: 8, iTotal: 10 });
        check(`record ${i + 1} -> 201`, oRec.status, 201);
    }

    const oParent = await readGoalRow(sGoalId);
    check('the parent rolled up to 80%', Number(oParent.dProgress), 80);
    check('the parent has no records of its OWN', await ownRecordCount(sGoalId), 0);

    // ---------------------------------------------------------------------
    section('GET /students/:id/report includes the divided goal');
    const sStart = isoDay(7);
    const sEnd = isoDay(0);
    const oRep = await request(app)
        .get(`${BASE}/students/${oFix.sStudentId}/report?tStartDate=${sStart}&tEndDate=${sEnd}`)
        .set(oAuth);
    check('GET report -> 200', oRep.status, 200);

    const aGoals = oRep.body?.oData?.aGoals || [];
    const oReported = aGoals.find((g: any) => g.sGoalId === sGoalId);
    checkTrue('the divided goal is in the report (it used to vanish)', !!oReported);
    check('with its rolled-up progress, not 0', Number(oReported?.dProgress), 80);

    section('its card carries the records logged in the stages');
    const aRecords = oReported?.aRecords || [];
    check('2 records attributed to the parent', aRecords.length, 2);
    check('each record names its stage', aRecords[0]?.sSubGoalTitle, sStageTitle);
    check('and carries the stage id', aRecords[0]?.sSubGoalId, sSubGoalId);
    check('sGoalId still points at the row\'s real owner', aRecords[0]?.sGoalId, sSubGoalId);
    checkTrue('the values needed by the PDF are there', aRecords[0]?.iCorrect === 8 && aRecords[0]?.iTotal === 10);
    checkTrue('and the date', !!aRecords[0]?.dtDate);

    section('subgoals are never reported as goals of their own');
    check('no stage in aGoals', aGoals.some((g: any) => g.sGoalId === sSubGoalId), false);

    section('the summary counts it as an active goal with progress');
    const oSummary = oRep.body?.oData?.oSummary || oRep.body?.oData || {};
    note(`summary: ${JSON.stringify({
        iActiveGoals: oSummary.iActiveGoals,
        dAverageProgress: oSummary.dAverageProgress
    })}`);
    checkTrue('iActiveGoals counts at least this goal', Number(oSummary.iActiveGoals) >= 1);
    checkTrue('dAverageProgress is above 0', Number(oSummary.dAverageProgress) > 0);

    // ---------------------------------------------------------------------
    section('a record straight on a divided goal is still refused');
    const oBad = await request(app).post(`${BASE}/trackingRecords`).set(oAuth)
        .send({ sGoalId, dtDate: isoDay(0), iCorrect: 5, iTotal: 10 });
    check('POST with the parent id -> 409', oBad.status, 409);
}
