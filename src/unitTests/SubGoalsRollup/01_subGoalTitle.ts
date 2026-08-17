/**
 * Punto 7 — la submeta guarda su PROPIO título.
 *
 * Lucy's report: "al crear una submeta enviando sTitle:'Etapa 1', el backend guarda el título de la
 * meta padre e ignora el enviado."
 *
 * Acceptance criterion from the feedback document, tested literally here:
 *   crear una submeta con sTitle:"Etapa 1 — Vocales" y que GET /goals/:id/subGoals devuelva ese
 *   mismo texto.
 *
 * The inheritance fallback is tested too, because `GoalForm.vue` sends `sTitle: ''` while its title
 * input is hidden in subgoal mode: a blank value must fall back to the parent's title instead of
 * saving an empty heading.
 */
import {
    request, app, BASE, TEST_PREFIX,
    section, check, checkTrue, note, setFile,
    pickFixture, mintAuth, trackGoal, readGoalRow
} from './helpers';

export default async function run(): Promise<void> {
    setFile('01_subGoalTitle');

    const oFix = await pickFixture();
    const oAuth = await mintAuth(oFix.sMainUserId);
    note(`school ${oFix.sSchoolId.slice(0, 8)} · student ${oFix.sStudentName}`);

    // ---------------------------------------------------------------------
    section('a divided goal, created through the API');
    const sParentTitle = `${TEST_PREFIX} meta anual de lectura`;
    const oGoal = await request(app).post(`${BASE}/goals`).set(oAuth).send({
        sStudentId: oFix.sStudentId,
        sTitle: sParentTitle,
        sMeasurementType: 'EXACTITUD',
        sDirection: 'INCREASE',
        iTargetValue: 100,
        bHasSubGoals: true
    });
    check('POST /goals -> 201', oGoal.status, 201);
    const sGoalId = oGoal.body?.goal?.sGoalId;
    trackGoal(sGoalId);
    checkTrue('the goal has an id', !!sGoalId);
    if (!sGoalId) return;

    // ---------------------------------------------------------------------
    section("POST /goals/:id/subGoals persists the title it was sent");
    const sOwnTitle = 'Etapa 1 — Vocales';
    const oSub1 = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth).send({
        sTitle: sOwnTitle,
        sDescription: 'reconocimiento de vocales',
        iTargetValue: 100,
        // GoalForm always sends these; they are inherited/ignored, never a 409.
        sMeasurementType: 'ESCALA',
        bHasSubGoals: false
    });
    check('POST subGoal -> 201', oSub1.status, 201);
    const oSub1Body = oSub1.body?.oData || {};
    const sSub1Id = oSub1Body.sSubGoalId;
    trackGoal(sSub1Id);
    check('the response carries the title we sent', oSub1Body.sTitle, sOwnTitle);
    check('sMeasurementType stays inherited from the parent', oSub1Body.sMeasurementType, 'EXACTITUD');

    // The acceptance criterion, read back the way the frontend reads it.
    const oList = await request(app).get(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth);
    check('GET /goals/:id/subGoals -> 200', oList.status, 200);
    const aList = oList.body?.aData || [];
    check('GET returns the subgoal\'s OWN title', aList[0]?.sTitle, sOwnTitle);
    check('...and NOT the parent\'s', aList[0]?.sTitle === sParentTitle, false);

    // ---------------------------------------------------------------------
    section('a blank title still inherits the parent (current GoalForm sends sTitle: "")');
    const oSub2 = await request(app).post(`${BASE}/goals/${sGoalId}/subGoals`).set(oAuth).send({
        sTitle: '',
        iTargetValue: 100
    });
    check('POST subGoal with sTitle:"" -> 201', oSub2.status, 201);
    const sSub2Id = (oSub2.body?.oData || {}).sSubGoalId;
    trackGoal(sSub2Id);
    const oSub2Row = await readGoalRow(sSub2Id);
    check('blank -> inherits the parent title', oSub2Row?.sTitle, sParentTitle);

    // ---------------------------------------------------------------------
    section('PUT /subGoals/:id can edit that title');
    const sEdited = 'Etapa 1 — Vocales y sílabas';
    const oPut = await request(app).put(`${BASE}/subGoals/${sSub1Id}`).set(oAuth).send({ sTitle: sEdited });
    check('PUT -> 200', oPut.status, 200);
    check('the new title is returned', (oPut.body?.oData || {}).sTitle, sEdited);
    check('and it is persisted', (await readGoalRow(sSub1Id))?.sTitle, sEdited);

    section('an empty title on edit does NOT wipe the stored one');
    const oPutBlank = await request(app).put(`${BASE}/subGoals/${sSub1Id}`).set(oAuth).send({ sTitle: '' });
    check('PUT with sTitle:"" -> 200', oPutBlank.status, 200);
    check('the previous title survives', (await readGoalRow(sSub1Id))?.sTitle, sEdited);

    section('a partial edit does not blank the rest of the configuration');
    const oPutDesc = await request(app).put(`${BASE}/subGoals/${sSub1Id}`).set(oAuth).send({ sDescription: 'ajuste' });
    check('PUT description only -> 200', oPutDesc.status, 200);
    check('title untouched', (await readGoalRow(sSub1Id))?.sTitle, sEdited);
}
