/**
 * P7 — runner for the sequential-stage / own-title / average-window tests
 * (Lucy's feedback, 2026-08-17 and 2026-08-18).
 *
 *   npm run test:subgoals            all files
 *   npm run test:subgoals -- 02      only files whose name starts with 02
 *
 * These are INTEGRATION tests: they drive the real Express app against the real development
 * database, ordered and serial, and hard-delete every row they create. One guard runs first — the
 * suite writes goals and tracking records, so it refuses to run against any database other than
 * `development`.
 */
require('dotenv').config();
import { db } from '../../Config/Db.config';
import {
    results, assertSafeDatabase, releaseSessions, releaseGoals, countResidue, TEST_PREFIX
} from './helpers';

interface ISuite { sName: string; run: () => Promise<void>; }

const aSuites: ISuite[] = [
    { sName: '01_subGoalTitle',     run: require('./01_subGoalTitle').default },
    { sName: '02_sequentialStages', run: require('./02_sequentialStages').default },
    { sName: '03_studentReport',    run: require('./03_studentReport').default },
    { sName: '04_averageWindow',    run: require('./04_averageWindow').default },
    { sName: '05_frontendContract', run: require('./05_frontendContract').default },
];

(async () => {
    const aFilters = process.argv.slice(2).filter(a => !a.startsWith('-'));
    const iStarted = Date.now();

    console.log('\n═══ MyVillage — P7: sequential stages, own title, average window ═══\n');

    try {
        await assertSafeDatabase();
    } catch (error: any) {
        console.error(`\n  ${error.message}\n`);
        process.exit(1);
    }

    const oDb = await db.raw('select current_database() as db');
    console.log(`  database : ${oDb.rows[0].db}`);
    console.log(`  fixtures : goals titled "${TEST_PREFIX}…", removed in teardown`);
    if (aFilters.length) console.log(`  filter   : ${aFilters.join(', ')}`);

    for (const oSuite of aSuites) {
        if (aFilters.length && !aFilters.some(f => oSuite.sName.startsWith(f))) continue;
        console.log(`\n▸ ${oSuite.sName}`);
        try {
            await oSuite.run();
        } catch (error: any) {
            results.fail++;
            results.failures.push(`${oSuite.sName} :: THREW — ${error.message}`);
            console.log(`     ERROR ${error.message}`);
        }
    }

    // ---- teardown ----
    console.log('\n▸ teardown');
    const iRemoved = await releaseGoals();
    console.log(`     ${iRemoved} goal/subgoal row(s) removed with their records`);
    await releaseSessions();
    console.log('     test sessions removed');

    // ---- residue check: the suite must leave nothing behind ----
    const iResidue = await countResidue();
    console.log(`     residue: ${iResidue} "${TEST_PREFIX}" goal(s) ${iResidue === 0 ? '— clean' : '— ⚠️ NOT CLEAN'}`);
    if (iResidue !== 0) {
        results.fail++;
        results.failures.push('teardown :: the suite left goals behind in the database');
    }

    // ---- summary ----
    const iSecs = ((Date.now() - iStarted) / 1000).toFixed(1);
    console.log('\n═══ summary ═══');
    console.log(`  passed  ${results.pass}`);
    console.log(`  failed  ${results.fail}`);
    console.log(`  skipped ${results.skip}`);
    console.log(`  time    ${iSecs}s`);
    if (results.failures.length) {
        console.log('\n  failures:');
        results.failures.forEach(f => console.log(`    • ${f}`));
    }
    console.log('');

    process.exit(results.fail > 0 ? 1 : 0);
})();
