/**
 * ⚠️ SUPERSEDED — kept for the record, NOT executed.
 *
 * This file tested the rule the PO approved on 2026-08-14: a divided goal's `dProgress` was the
 * AVERAGE of all its subgoals, with an empty subgoal counting as 0 (two stages at 90% and 0% → 45%).
 *
 * The client (Lucy) replaced that rule on 2026-08-18: the goal does not average anything, it MIRRORS
 * its stage in progress. Her words: *"lo que no quiero es que se promedien la submeta 1 y la submeta 2
 * para que en la meta me dé un 50%, porque no es real."*
 *
 * The live rule is tested by `02_sequentialStages.ts`. This file is commented out rather than deleted
 * so the reversal stays traceable: if anyone later asks "did the average version ever work?", the
 * answer and the exact assertions are right here — all 39 of them passed before the rule changed.
 *
 * It is NOT registered in `run.ts`, so `npm run test:subgoals` does not execute it. To resurrect it,
 * the averaging branch in `recalculateParentRollup()` would have to come back too — see the
 * commented-out block in `trackingRecords.queries.ts`.
 */

/* eslint-disable */
/*
/**
 * Punto 7 — la meta padre agrega el avance de sus submetas (rollup).
 *
 * Lucy's report: "la tarjeta de la meta anual, el dashboard y el reporte salen en 0%, aunque las
 * submetas tengan registros."
 *
 * Cause: a divided goal has no records of its own (they live in the subgoals), so its stored
 * `dProgress` stayed at 0 — and the card, the dashboard, the PDF and `/schools/analytics` all read
 * that stored column.
 *
 * RULE UNDER TEST (PO decision 2026-08-14): the parent's dProgress is the average across ALL active
 * subgoals, with an empty subgoal counting as 0 — NOT the average of the started ones only.
 * `iRecordsCount` is the sum and `tLastRecord` the most recent.
 */
import {
    request, app, BASE, TEST_PREFIX,
    section, check, checkTrue, note, setFile,
    pickFixture, mintAuth, trackGoal, readGoalRow, readSubGoalRows, round2, isoDay
} from './helpers';

/** Three EXACTITUD records at hits/total, on three different days. */
async function logThreeRecords(oAuth: any, sSubGoalId: string, iHits: number, iTotal: number): Promise<number> {
    let iOk = 0;
    for (let i = 0; i < 3; i++) {
        const oRes = await request(app).post(`${BASE}/trackingRecords`).set(oAuth).send({
            sSubGoalId,
            dtDate: isoDay(i),
            iCorrect: iHits,
            iTotal: iTotal
        });
        if (oRes.status === 201) iOk++;
        else console.log(`           record ${i} -> ${oRes.status} ${JSON.stringify(oRes.body).slice(0, 160)}`);
    }
    return iOk;
}

export default async function run(): Promise<void> {
    setFile('02_parentRollup');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);

    // ---------------------------------------------------------------------
    section('a divided goal with two stages, only one of them started');
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} rollup`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    if (!sGoalId) return;

    const aSubIds: string[] = [];
    for (const sTitle of ['Etapa 1', 'Etapa 2']) {
        const oSub = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth)
            .send({ sTitle, iTargetValue: 100 });
        check(`POST subGoal "${sTitle}" -> 201`, oSub.status, 201);
        const sId = (oSub.body?.oData || {}).sSubGoalId;
        aSubIds.push(sId);
        trackGoal(sId);
    }

    // Creating an empty subgoal already moves the parent: it counts as a 0.
    const oParentEmpty = await readGoalRow(sGoalId);
    check('two empty stages -> parent still 0%', Number(oParentEmpty.dProgress), 0);
    check('the parent is flagged as divided', oParentEmpty.bHasSubGoals, true);

    // ---------------------------------------------------------------------
    section('9/10 three times on stage 1 — the parent must NOT stay at 0');
    check('3 records created', await logThreeRecords(oAuth, aSubIds[0], 9, 10), 3);

    const aSubs = await readSubGoalRows(sGoalId);
    const dStage1 = Number(aSubs.find((s: any) => s.sGoalId === aSubIds[0])?.dProgress);
    const dStage2 = Number(aSubs.find((s: any) => s.sGoalId === aSubIds[1])?.dProgress);
    check('stage 1 is at 90%', dStage1, 90);
    check('stage 2 (no records) is at 0%', dStage2, 0);

    const oParent = await readGoalRow(sGoalId);
    note(`stages: ${dStage1}% and ${dStage2}%`);
    check('parent = average of ALL stages (PO rule)', Number(oParent.dProgress), round2((dStage1 + dStage2) / 2));
    check('parent is 45%, not 0', Number(oParent.dProgress), 45);
    check('...and NOT the started-only average (90)', Number(oParent.dProgress) === 90, false);
    check('parent iRecordsCount = sum of the stages', Number(oParent.iRecordsCount), 3);
    checkTrue('parent tLastRecord is set', !!oParent.tLastRecord);

    // ---------------------------------------------------------------------
    section('GET /goals/:id serves the rolled-up figure (the goal card)');
    const oGet = await request(app).get(`${BASE}/goals/${sGoalId}`).set(oAuth);
    check('GET /goals/:id -> 201', oGet.status, 201);
    check('dProgress in the response is the rollup', Number(oGet.body?.goal?.dProgress), 45);

    section('GET /goals/student/:id serves it too (the student\'s goal list)');
    const oList = await request(app).get(`${BASE}/goals/student/${oFix.sStudentId}`).set(oAuth);
    check('GET /goals/student/:id -> 201', oList.status, 201);
    const oInList = (oList.body?.goals || []).find((g: any) => g.sGoalId === sGoalId);
    checkTrue('the divided goal is listed', !!oInList);
    check('with the rolled-up dProgress', Number(oInList?.dProgress), 45);
    check('and subgoals are NOT listed as goals', (oList.body?.goals || []).some((g: any) => aSubIds.includes(g.sGoalId)), false);

    // ---------------------------------------------------------------------
    section('starting the second stage moves the parent again');
    check('3 more records created', await logThreeRecords(oAuth, aSubIds[1], 6, 10), 3);
    const aSubs2 = await readSubGoalRows(sGoalId);
    const dA = Number(aSubs2.find((s: any) => s.sGoalId === aSubIds[0])?.dProgress);
    const dB = Number(aSubs2.find((s: any) => s.sGoalId === aSubIds[1])?.dProgress);
    const oParent2 = await readGoalRow(sGoalId);
    check('stage 2 is at 60%', dB, 60);
    check('parent = 75%', Number(oParent2.dProgress), round2((dA + dB) / 2));
    check('parent iRecordsCount = 6', Number(oParent2.iRecordsCount), 6);

    // ---------------------------------------------------------------------
    section('deleting a stage re-averages the parent');
    const oDel = await request(app).delete(`${BASE}/subGoals/${aSubIds[1]}`).set(oAuth);
    check('DELETE /subGoals/:id -> 200', oDel.status, 200);
    const oParent3 = await readGoalRow(sGoalId);
    check('parent falls back to the surviving stage (90%)', Number(oParent3.dProgress), 90);
    check('parent iRecordsCount drops to 3', Number(oParent3.iRecordsCount), 3);

    section('deleting the last stage resets the parent instead of freezing a stale number');
    check('DELETE -> 200', (await request(app).delete(`${BASE}/subGoals/${aSubIds[0]}`).set(oAuth)).status, 200);
    const oParent4 = await readGoalRow(sGoalId);
    check('parent dProgress back to 0', Number(oParent4.dProgress), 0);
    check('parent iRecordsCount back to 0', Number(oParent4.iRecordsCount), 0);
    check('parent tLastRecord cleared', oParent4.tLastRecord, null);
}
*/
