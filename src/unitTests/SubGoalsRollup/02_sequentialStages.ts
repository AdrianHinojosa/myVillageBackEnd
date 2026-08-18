/**
 * P7 — SEQUENTIAL stages, and the goal as a mirror of the stage in progress.
 *
 * Rule set by the client (Lucy, 2026-08-18), in her own words:
 *
 *   > "Submeta 1: 80% — siempre y cuando esta submeta esté activa, la meta es 80%.
 *   >  Se cierra la submeta 1 porque ya se completó. Submeta 2: 20% — siempre y cuando esta
 *   >  submeta esté activa, la meta es 20%.
 *   >  Lo que no quiero es que se promedien la submeta 1 y la submeta 2 para que en la meta me dé
 *   >  un 50%, porque no es real."
 *
 * Two things are under test, and they depend on each other:
 *
 *   1. **The sequential machine** — at most ONE stage is `ACTIVE`. New stages queue as `PAUSED`,
 *      closing the current one promotes the next, reopening one demotes the current.
 *   2. **The mirror** — the goal's `dProgress` equals the ACTIVE stage's, never an average. With no
 *      active stage it falls back to the LAST CLOSED one, and to 0 when nothing has started.
 *
 * Including the consequence the client explicitly confirmed: closing a stage at 80% when the next
 * one has no records drops the goal to **0%**, on purpose.
 */
import {
    request, app, BASE, TEST_PREFIX,
    section, check, checkTrue, note, setFile,
    pickFixture, mintAuth, trackGoal, readGoalRow, readSubGoalRows, isoDay
} from './helpers';

/** Log `iHowMany` EXACTITUD records at hits/total on consecutive days. Returns how many took. */
async function logRecords(oAuth: any, sSubGoalId: string, iHits: number, iTotal: number, iHowMany = 3): Promise<number> {
    let iOk = 0;
    for (let i = 0; i < iHowMany; i++) {
        const oRes = await request(app).post(`${BASE}/trackingRecords`).set(oAuth).send({
            sSubGoalId, dtDate: isoDay(i), iCorrect: iHits, iTotal
        });
        if (oRes.status === 201) iOk++;
        else console.log(`           record ${i} -> ${oRes.status} ${JSON.stringify(oRes.body).slice(0, 140)}`);
    }
    return iOk;
}

const setStatus = (oAuth: any, sId: string, sStatus: string, oExtra: any = {}) =>
    request(app).put(`${BASE}/subGoals/${sId}`).set(oAuth).send({ sStatus, ...oExtra });

export default async function run(): Promise<void> {
    setFile('02_sequentialStages');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);

    // ---------------------------------------------------------------------
    section('a divided goal with three stages');
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: `${TEST_PREFIX} sequential`,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    if (!sGoalId) return;

    const aIds: string[] = [];
    for (const sTitle of ['Stage 1', 'Stage 2', 'Stage 3']) {
        // GoalForm always sends sStatus ACTIVE — the machine must override it.
        const oSub = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth)
            .send({ sTitle, iTargetValue: 100, sStatus: 'ACTIVE' });
        check(`POST "${sTitle}" -> 201`, oSub.status, 201);
        const sId = (oSub.body?.oData || {}).sSubGoalId;
        aIds.push(sId);
        trackGoal(sId);
    }

    section('only ONE stage is in progress, even though all three asked for ACTIVE');
    let aRows = await readSubGoalRows(sGoalId);
    check('Stage 1 -> ACTIVE', aRows[0]?.sStatus, 'ACTIVE');
    check('Stage 2 -> PAUSED (queued)', aRows[1]?.sStatus, 'PAUSED');
    check('Stage 3 -> PAUSED (queued)', aRows[2]?.sStatus, 'PAUSED');
    check('exactly one ACTIVE', aRows.filter((o: any) => o.sStatus === 'ACTIVE').length, 1);
    check('the goal starts at 0% (stage in progress has no records)', Number((await readGoalRow(sGoalId)).dProgress), 0);

    // ---------------------------------------------------------------------
    section('capturing on the stage in progress moves the goal to the SAME number');
    check('3 records on Stage 1', await logRecords(oAuth, aIds[0], 9, 10), 3);
    aRows = await readSubGoalRows(sGoalId);
    const dStage1 = Number(aRows[0].dProgress);
    check('Stage 1 is at 90%', dStage1, 90);
    check('the goal is at 90% — the same, not an average', Number((await readGoalRow(sGoalId)).dProgress), 90);
    check('...and NOT 30% (90+0+0)/3', Number((await readGoalRow(sGoalId)).dProgress) === 30, false);

    // The contract's wording: "hay que cerrar una etapa para avanzar".
    section('a queued stage refuses records — a stage must be closed before moving on');
    const oBlocked = await request(app).post(`${BASE}/trackingRecords`).set(oAuth)
        .send({ sSubGoalId: aIds[1], dtDate: isoDay(0), iCorrect: 5, iTotal: 10 });
    check('POST on a PAUSED stage -> 409', oBlocked.status, 409);

    // ---------------------------------------------------------------------
    section('closing the stage promotes the next one, and the goal drops to 0%');
    const oClose1 = await setStatus(oAuth, aIds[0], 'COMPLETED', { tCompletedDate: isoDay(0) });
    check('PUT sStatus COMPLETED -> 200', oClose1.status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('Stage 1 -> COMPLETED', aRows[0]?.sStatus, 'COMPLETED');
    check('Stage 2 promoted to ACTIVE automatically', aRows[1]?.sStatus, 'ACTIVE');
    check('Stage 3 still queued', aRows[2]?.sStatus, 'PAUSED');
    check('the goal drops to 0% (confirmed with the client)', Number((await readGoalRow(sGoalId)).dProgress), 0);
    note('the goal shows where the student is NOW, not a blended history');

    section('the new stage in progress drives the goal');
    check('2 records on Stage 2', await logRecords(oAuth, aIds[1], 2, 10, 2), 2);
    aRows = await readSubGoalRows(sGoalId);
    check('Stage 2 is at 20%', Number(aRows[1].dProgress), 20);
    check('the goal is at 20%', Number((await readGoalRow(sGoalId)).dProgress), 20);
    check('...and NOT 55% (90+20)/2', Number((await readGoalRow(sGoalId)).dProgress) === 55, false);

    section('the API serves that same number');
    const oGet = await request(app).get(`${BASE}/goals/${sGoalId}`).set(oAuth);
    check('GET /goals/:id -> 201', oGet.status, 201);
    check('dProgress = 20', Number(oGet.body?.goal?.dProgress), 20);
    const oList = await request(app).get(`${BASE}/goals/student/${oFix.sStudentId}`).set(oAuth);
    const oInList = (oList.body?.goals || []).find((g: any) => g.sGoalId === sGoalId);
    check('the student list agrees', Number(oInList?.dProgress), 20);

    // ---------------------------------------------------------------------
    section('reopening a closed stage takes the baton back');
    const oReopen = await setStatus(oAuth, aIds[0], 'ACTIVE');
    check('PUT sStatus ACTIVE on the closed stage -> 200', oReopen.status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('Stage 1 -> ACTIVE again', aRows[0]?.sStatus, 'ACTIVE');
    check('Stage 2 stepped aside to PAUSED', aRows[1]?.sStatus, 'PAUSED');
    check('still exactly one ACTIVE', aRows.filter((o: any) => o.sStatus === 'ACTIVE').length, 1);
    check('the goal mirrors Stage 1 again (90%)', Number((await readGoalRow(sGoalId)).dProgress), 90);

    section('closing it again hands the baton forward');
    check('PUT COMPLETED -> 200', (await setStatus(oAuth, aIds[0], 'COMPLETED')).status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('Stage 2 is in progress again', aRows[1]?.sStatus, 'ACTIVE');
    check('the goal is back to 20%', Number((await readGoalRow(sGoalId)).dProgress), 20);

    // ---------------------------------------------------------------------
    section('finishing every stage: the goal keeps the LAST closed stage\'s number');
    check('PUT Stage 2 COMPLETED -> 200', (await setStatus(oAuth, aIds[1], 'COMPLETED')).status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('Stage 3 is now in progress', aRows[2]?.sStatus, 'ACTIVE');
    check('3 records on Stage 3', await logRecords(oAuth, aIds[2], 10, 10), 3);
    check('Stage 3 is at 100%', Number((await readSubGoalRows(sGoalId))[2].dProgress), 100);
    check('the goal follows it', Number((await readGoalRow(sGoalId)).dProgress), 100);

    check('PUT Stage 3 COMPLETED -> 200', (await setStatus(oAuth, aIds[2], 'COMPLETED')).status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('no stage is in progress', aRows.filter((o: any) => o.sStatus === 'ACTIVE').length, 0);
    const oFinal = await readGoalRow(sGoalId);
    check('the goal keeps the last closed stage (100%)', Number(oFinal.dProgress), 100);
    check('iRecordsCount is the TOTAL across every stage', Number(oFinal.iRecordsCount), 8);
    checkTrue('tLastRecord is set', !!oFinal.tLastRecord);

    // ---------------------------------------------------------------------
    section('pausing the only stage in progress leaves the goal on the last closed one');
    check('reopen Stage 3 -> 200', (await setStatus(oAuth, aIds[2], 'ACTIVE')).status, 200);
    check('PUT PAUSED -> 200', (await setStatus(oAuth, aIds[2], 'PAUSED')).status, 200);
    aRows = await readSubGoalRows(sGoalId);
    check('nothing in progress', aRows.filter((o: any) => o.sStatus === 'ACTIVE').length, 0);
    check('the goal falls back to Stage 2, the last closed (20%)', Number((await readGoalRow(sGoalId)).dProgress), 20);

    // ---------------------------------------------------------------------
    section('deleting the stage in progress promotes the next unfinished one');
    check('reopen Stage 3 -> 200', (await setStatus(oAuth, aIds[2], 'ACTIVE')).status, 200);
    check('add a 4th stage -> 201', (await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth)
        .send({ sTitle: 'Stage 4', iTargetValue: 100 })).status, 201);
    const sFourth = (await readSubGoalRows(sGoalId))[3]?.sGoalId;
    trackGoal(sFourth);
    check('the 4th queued as PAUSED', (await readGoalRow(sFourth)).sStatus, 'PAUSED');

    check('DELETE the stage in progress -> 200',
        (await request(app).delete(`${BASE}/subGoals/${aIds[2]}`).set(oAuth)).status, 200);
    check('the 4th took over', (await readGoalRow(sFourth)).sStatus, 'ACTIVE');
    check('the goal is at 0% (the new stage has no records)', Number((await readGoalRow(sGoalId)).dProgress), 0);

    section('deleting the last stage resets the goal');
    check('DELETE -> 200', (await request(app).delete(`${BASE}/subGoals/${sFourth}`).set(oAuth)).status, 200);
    check('DELETE -> 200', (await request(app).delete(`${BASE}/subGoals/${aIds[0]}`).set(oAuth)).status, 200);
    check('DELETE -> 200', (await request(app).delete(`${BASE}/subGoals/${aIds[1]}`).set(oAuth)).status, 200);
    const oEmpty = await readGoalRow(sGoalId);
    check('dProgress back to 0', Number(oEmpty.dProgress), 0);
    check('iRecordsCount back to 0', Number(oEmpty.iRecordsCount), 0);
    check('tLastRecord cleared', oEmpty.tLastRecord, null);
}
