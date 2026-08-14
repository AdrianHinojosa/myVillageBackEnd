/**
 * Punto 3 — runner for the billing / Stripe subscription tests.
 *
 *   npm run test:stripe            all files
 *   npm run test:stripe -- 01 05   only files whose name starts with 01 or 05
 *
 * These are INTEGRATION tests: they drive the real Express app against the real development database
 * and the real Stripe sandbox. They are ordered, serial, and clean up after themselves.
 *
 * Two guards run before anything else — the suite mutates school rows (including SUSPENDED, which
 * locks users out) and creates Stripe objects, so it refuses to run against any database other than
 * `development`, or against a live Stripe key.
 */
require('dotenv').config();
import { db } from '../../Config/Db.config';
import stripe from '../../Services/Stripe.service';
import {
    results, assertSafeDatabase, assertSafeStripe, hasStripe,
    releaseSessions, releaseStripe
} from './helpers';

interface ISuite { sName: string; run: () => Promise<void>; }

const aSuites: ISuite[] = [
    { sName: '01_money',           run: require('./01_money').default },
    { sName: '02_schoolsConfig',   run: require('./02_schoolsConfig').default },
    { sName: '03_billingEndpoints',run: require('./03_billingEndpoints').default },
    { sName: '04_cards',           run: require('./04_cards').default },
    { sName: '05_webhooks',        run: require('./05_webhooks').default },
    { sName: '06_tariffSync',      run: require('./06_tariffSync').default },
    { sName: '07_trialAndCharge',  run: require('./07_trialAndCharge').default },
];

(async () => {
    const aFilters = process.argv.slice(2).filter(a => !a.startsWith('-'));
    const iStarted = Date.now();

    console.log('\n═══ MyVillage — Punto 3: Cobranza automática (Stripe) ═══\n');

    try {
        await assertSafeDatabase();
        assertSafeStripe();
    } catch (error: any) {
        console.error(`\n  ${error.message}\n`);
        process.exit(1);
    }

    const oDb = await db.raw('select current_database() as db');
    console.log(`  database : ${oDb.rows[0].db}`);
    console.log(`  stripe   : ${hasStripe() ? 'test-mode key present' : 'NOT configured — Stripe-dependent files will skip'}`);
    console.log(`  webhook  : ${process.env.STRIPE_WEBHOOK_SECRET ? 'secret present' : 'no secret — a local one is generated for signature tests'}`);
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
    await releaseSessions();
    console.log('     test sessions removed');
    if (hasStripe()) {
        const oFreed = await releaseStripe(stripe);
        console.log(`     stripe sandbox cleaned: ${oFreed.subs} subscription(s), ${oFreed.customers} customer(s), ${oFreed.clocks} clock(s)`);
    }

    // ---- residue check: the suite must leave nothing behind ----
    const oResidue = await db.raw(`select
        (select count(*)::int from myvillageschema."Payments" where "sStripeTransactionId" like 'ch_unittest%') stray_payments,
        (select count(*)::int from myvillageschema."Schools" where "sStripeCustomerId" like 'cus_unittest%') stray_customers,
        (select count(*)::int from myvillageschema."Schools" where "sBillingStatus" = 'SUSPENDED') suspended`);
    const oR = oResidue.rows[0];
    const bClean = oR.stray_payments === 0 && oR.stray_customers === 0 && oR.suspended === 0;
    console.log(`     residue: ${oR.stray_payments} stray payment(s), ${oR.stray_customers} stray customer id(s), ${oR.suspended} suspended school(s) ${bClean ? '— clean' : '— ⚠️ NOT CLEAN'}`);
    if (!bClean) {
        results.fail++;
        results.failures.push('teardown :: the suite left residue in the database');
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
