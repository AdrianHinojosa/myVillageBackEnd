/**
 * Pure logic — no database, no Stripe, no network.
 *
 * These guard the single most consequential piece of P3: the amount actually charged. The formula is
 * a deliberate mirror of the frontend's `computeMonthlyTotal()` in app/utils/billing.ts, because the
 * frontend previews the figure and the backend charges it. If they ever diverge, a school is billed
 * something other than what it was shown.
 */
import { section, check, setFile } from './helpers';
import {
    toStripeAmount, fromStripeAmount, applyDiscount, computeMonthlyTotal, computeQuotaTotal,
    computeSchoolPlanTotal, getSchoolPlan, SCHOOL_PLAN_EXTRA_USER,
    hasChargeableTariff, mapStripeStatus, fromStripeTimestamp,
    BILLING_CURRENCY, TRIAL_PERIOD_DAYS, MAX_FAILED_ATTEMPTS
} from '../../Services/Stripe.service';
import { schoolNeedsCard } from '../../Middlewares/001_Permissions.mw.ts/schools.permissions';

export default async function run(): Promise<void> {
    setFile('01_money');

    section('constants match the contract');
    check('currency is MXN', BILLING_CURRENCY, 'MXN');
    check('trial is 14 days (PO decision)', TRIAL_PERIOD_DAYS, 14);
    check('max attempts is 3 (initial + 2 retries)', MAX_FAILED_ATTEMPTS, 3);

    section('peso <-> centavo conversion');
    check('1234.56 -> 123456', toStripeAmount(1234.56), 123456);
    check('round trip', fromStripeAmount(toStripeAmount(1234.56)), 1234.56);
    check('float dust 12.005 -> 1201', toStripeAmount(12.005), 1201);
    check('0 -> 0', toStripeAmount(0), 0);
    check('11700 -> 1170000', toStripeAmount(11700), 1170000);

    section('discount clamped to [0,100]');
    check('10% off 10000', applyDiscount(10000, 10), 9000);
    check('0% leaves it alone', applyDiscount(10000, 0), 10000);
    check('null leaves it alone', applyDiscount(10000, null), 10000);
    check('over 100 clamps to free', applyDiscount(10000, 150), 0);
    check('negative clamps to none', applyDiscount(10000, -50), 10000);
    check('rounds to 2 decimals', applyDiscount(99.99, 33), 66.99);

    section('FIXED modality');
    check('plain amount', computeMonthlyTotal({ sBillingMode: 'FIXED', dFixedAmount: 10000 }), 10000);
    check('with 10% off', computeMonthlyTotal({ sBillingMode: 'FIXED', dFixedAmount: 10000, dDiscountPct: 10 }), 9000);
    check('unconfigured is 0', computeMonthlyTotal({ sBillingMode: 'FIXED' }), 0);

    section('VARIABLE modality — uses the CONFIGURED LIMITS, not real headcount');
    const oVar = {
        sBillingMode: 'VARIABLE', dAmountPerTeacher: 500, dAmountPerStudent: 200,
        iUsersLimit: 10, iStudentsLimit: 40
    };
    check('500x10 + 200x40', computeMonthlyTotal(oVar), 13000);
    check('same with 10% off', computeMonthlyTotal({ ...oVar, dDiscountPct: 10 }), 11700);
    check('raising the teacher limit re-prices', computeMonthlyTotal({ ...oVar, iUsersLimit: 20, dDiscountPct: 10 }), 16200);
    check('zero limits -> 0', computeMonthlyTotal({ ...oVar, iUsersLimit: 0, iStudentsLimit: 0 }), 0);

    section('Punto 18 — You/You+ cobran por CUOTA sobre reales (base incluida + excedente)');
    // You: base 568.40 incl. 1 usuario / 10 pacientes, +$51.04/paciente, sin excedente de usuario.
    // (montos CON IVA: 490 + IVA = 568.40 ; 44 + IVA = 51.04)
    check('You base (1u/10p)', computeQuotaTotal('YOU', { iActiveUsers: 1, iActiveStudents: 10 }), 568.40);
    check('You +5 pacientes', computeQuotaTotal('YOU', { iActiveUsers: 1, iActiveStudents: 15 }), 823.60);
    check('You usuarios extra no cobran', computeQuotaTotal('YOU', { iActiveUsers: 5, iActiveStudents: 10 }), 568.40);
    // You+: base 742.40 incl. 4 usuarios / 10 pacientes, +$29/usuario, +$51.04/paciente.
    // (montos CON IVA: 640 + IVA = 742.40 ; 25 + IVA = 29.00 ; 44 + IVA = 51.04)
    check('You+ base (4u/10p)', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 4, iActiveStudents: 10 }), 742.40);
    check('You+ +2u +2p', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 6, iActiveStudents: 12 }), 902.48);
    check('You+ con 10% off', computeQuotaTotal('YOU_PLUS', { iActiveUsers: 6, iActiveStudents: 12, dDiscountPct: 10 }), 812.23);
    // computeMonthlyTotal enruta a la cuota solo para You/You+ cobradas por Stripe.
    check('computeMonthlyTotal enruta You (Stripe)', computeMonthlyTotal({ sAccountType: 'YOU', sPaymentMethod: 'STRIPE', iActiveUsers: 1, iActiveStudents: 15 }), 823.60);
    check('THERAPIST normaliza a You', computeMonthlyTotal({ sAccountType: 'THERAPIST', sPaymentMethod: 'STRIPE', iActiveUsers: 1, iActiveStudents: 15 }), 823.60);
    // SALVAGUARDA: una cuenta You en TRANSFER NO usa la cuota — conserva su tarifa manual (colegios/terapeutas en vivo).
    check('You en TRANSFER ignora la cuota', computeMonthlyTotal({ sAccountType: 'YOU', sPaymentMethod: 'TRANSFER', sBillingMode: 'FIXED', dFixedAmount: 300, iActiveStudents: 99 }), 300);

    section('Schools PLANS — planes A/B/C sobre LÍMITES, todos los alumnos al precio de su plan');
    // Montos CON IVA: A 250/70 -> 290/81.20 ; B 375/60 -> 435/69.60 ; C 500/50 -> 580/58 ; usuario 25 -> 29.
    check('el plan lo decide el límite de alumnos: 0 -> A', getSchoolPlan(0).sPlan, 'A');
    check('25 -> A', getSchoolPlan(25).sPlan, 'A');
    check('26 -> B', getSchoolPlan(26).sPlan, 'B');
    check('50 -> B', getSchoolPlan(50).sPlan, 'B');
    check('51 -> C', getSchoolPlan(51).sPlan, 'C');
    check('usuario extra es 25 + IVA', SCHOOL_PLAN_EXTRA_USER, 29);
    check('sin límites: solo la base de A', computeSchoolPlanTotal({}), 290);
    check('A: 8 usuarios (dentro de 10), 20 alumnos', computeSchoolPlanTotal({ iUsersLimit: 8, iStudentsLimit: 20 }), 1914);
    check('A tope: 10 usuarios, 25 alumnos', computeSchoolPlanTotal({ iUsersLimit: 10, iStudentsLimit: 25 }), 2320);
    check('B: 26 alumnos cuesta menos que 25 en A (aceptado)', computeSchoolPlanTotal({ iUsersLimit: 10, iStudentsLimit: 26 }), 2244.6);
    check('B: 18 usuarios (3 extra), 40 alumnos', computeSchoolPlanTotal({ iUsersLimit: 18, iStudentsLimit: 40 }), 3306);
    check('C: 22 usuarios (2 extra), 60 alumnos', computeSchoolPlanTotal({ iUsersLimit: 22, iStudentsLimit: 60 }), 4118);
    check('C: 51 alumnos', computeSchoolPlanTotal({ iUsersLimit: 20, iStudentsLimit: 51 }), 3538);
    check('B con 20% de descuento', computeSchoolPlanTotal({ iUsersLimit: 18, iStudentsLimit: 40, dDiscountPct: 20 }), 2644.8);
    // computeMonthlyTotal enruta PLANS y usa LÍMITES: los conteos reales se ignoran.
    const oPlans = { sAccountType: 'SCHOOL', sPaymentMethod: 'STRIPE', sBillingMode: 'PLANS', iUsersLimit: 18, iStudentsLimit: 40 };
    check('computeMonthlyTotal enruta PLANS', computeMonthlyTotal(oPlans), 3306);
    check('PLANS ignora los conteos reales', computeMonthlyTotal({ ...oPlans, iActiveUsers: 2, iActiveStudents: 3, iUsers: 2, iStudents: 3 }), 3306);
    check('PLANS ignora montos de FIXED/VARIABLE guardados', computeMonthlyTotal({ ...oPlans, dFixedAmount: 1, dAmountPerTeacher: 1, dAmountPerStudent: 1 }), 3306);
    check('a centavos para Stripe sin basura de flotante', toStripeAmount(computeSchoolPlanTotal({ iUsersLimit: 10, iStudentsLimit: 26 })), 224460);
    check('PLANS siempre es cobrable (base > 0)', hasChargeableTariff(oPlans), true);

    section('gate "a fuerza con tarjeta" — You/You+ y Schools por Stripe');
    const tFuture = new Date(Date.now() + 86400000).toISOString();
    const tPast = new Date(Date.now() - 86400000).toISOString();
    const oSchoolCard = { sAccountType: 'SCHOOL', sPaymentMethod: 'STRIPE', sBillingMode: 'PLANS', iUsersLimit: 10, iStudentsLimit: 20 };
    check('Schools Stripe sin tarjeta (NONE) se bloquea', schoolNeedsCard({ ...oSchoolCard, sBillingStatus: 'NONE' }), true);
    check('Schools en TRANSFER nunca', schoolNeedsCard({ ...oSchoolCard, sPaymentMethod: 'TRANSFER', sBillingStatus: 'NONE' }), false);
    check('Schools Stripe sin tarifa (0) no se bloquea', schoolNeedsCard({ sAccountType: 'SCHOOL', sPaymentMethod: 'STRIPE', sBillingMode: 'FIXED', sBillingStatus: 'NONE' }), false);
    check('Schools Stripe VARIABLE con tarifa también', schoolNeedsCard({ sAccountType: 'SCHOOL', sPaymentMethod: 'STRIPE', sBillingMode: 'VARIABLE', dAmountPerTeacher: 10, dAmountPerStudent: 5, iUsersLimit: 5, iStudentsLimit: 10, sBillingStatus: 'NONE' }), true);
    check('Schools con "Omitir bloqueo" no se bloquea', schoolNeedsCard({ ...oSchoolCard, sBillingStatus: 'NONE', bSkipBillingBlock: true }), false);
    check('Schools en prueba (TRIALING) entra', schoolNeedsCard({ ...oSchoolCard, sBillingStatus: 'TRIALING' }), false);
    check('Schools cancelado con periodo vigente entra', schoolNeedsCard({ ...oSchoolCard, sBillingStatus: 'CANCELED', tCurrentPeriodEnd: tFuture }), false);
    check('Schools cancelado y vencido se bloquea', schoolNeedsCard({ ...oSchoolCard, sBillingStatus: 'CANCELED', tCurrentPeriodEnd: tPast }), true);
    check('sin método de pago explícito (null) no se bloquea', schoolNeedsCard({ ...oSchoolCard, sPaymentMethod: null, sBillingStatus: 'NONE' }), false);
    check('You Stripe sin tarjeta sigue igual (se bloquea)', schoolNeedsCard({ sAccountType: 'YOU', sPaymentMethod: 'STRIPE', sBillingStatus: 'NONE' }), true);
    check('You+ en TRANSFER sigue igual (no)', schoolNeedsCard({ sAccountType: 'YOU_PLUS', sPaymentMethod: 'TRANSFER', sBillingStatus: 'NONE' }), false);

    section('chargeability');
    check('a real tariff is chargeable', hasChargeableTariff({ sBillingMode: 'FIXED', dFixedAmount: 100 }), true);
    check('nothing configured is not', hasChargeableTariff({ sBillingMode: 'FIXED' }), false);
    check('100% discount is not', hasChargeableTariff({ sBillingMode: 'FIXED', dFixedAmount: 100, dDiscountPct: 100 }), false);

    section('Stripe status -> our status');
    check('trialing', mapStripeStatus('trialing'), 'TRIALING');
    check('active', mapStripeStatus('active'), 'ACTIVE');
    check('past_due', mapStripeStatus('past_due'), 'PAST_DUE');
    check('unpaid means retries exhausted', mapStripeStatus('unpaid'), 'SUSPENDED');
    check('incomplete_expired likewise', mapStripeStatus('incomplete_expired'), 'SUSPENDED');
    check('canceled', mapStripeStatus('canceled'), 'CANCELED');
    check('active + cancel_at_period_end', mapStripeStatus('active', true), 'CANCELED');
    check('trialing + cancel_at_period_end', mapStripeStatus('trialing', true), 'CANCELED');
    check('unknown falls back to NONE', mapStripeStatus('something_new'), 'NONE');

    section('timestamps');
    check('unix seconds -> ISO', fromStripeTimestamp(0), null);
    check('null stays null', fromStripeTimestamp(null), null);
    check('a real value parses', typeof fromStripeTimestamp(1700000000), 'string');
}
