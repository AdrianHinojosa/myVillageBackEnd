import MyError from '../Error.mw';
import { Response, Request, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import Services from '../../Services/Index.services';
import SessionQueries from '../../Api/003_Authentication/002_Sessions/sessions.queries';
import SchoolUserQueries from '../../Api/022_Schools/001_SchoolUsers/schoolUsers.queries';
import SchoolQueries from '../../Api/022_Schools/schools.queries';

import {IAdministrators} from '../../Api/005_Administrators/administrators.model';

import ErrorMessages from '../../Utils/ErrorMessages.util';
import { normalizeModality, hasChargeableTariff } from '../../Services/Stripe.service';

// Punto 18 — "a fuerza con tarjeta" (decisión Lucy 2026-10-19): una cuenta You/You+ cobrada por
// Stripe debe tener una suscripción activa para usar la plataforma. Mientras no hay tarjeta
// (sBillingStatus NONE) o la suscripción quedó cancelada (CANCELED), se bloquea el acceso — como una
// suspendida — hasta que registren un método de pago. Transferencia queda exenta; TRIALING, ACTIVE y
// PAST_DUE siguen con acceso.
// Schools (decisión PO 2026-10-31): misma regla para un colegio cobrado por Stripe (FIXED, VARIABLE o
// PLANS), solo si tiene una tarifa > 0 — sin monto no se crea suscripción, y bloquearlo lo dejaría
// encerrado para siempre. Exportado para las pruebas.
export const schoolNeedsCard = (oSchool: any): boolean => {
    // Override manual del superadmin (Lucy/Sam 2026-10-26): "Omitir bloqueo por cobranza". Cuando
    // está prendido, la cuenta NO se bloquea por el gate "a fuerza con tarjeta" aunque no tenga
    // suscripción activa. NO toca el cobro (Stripe sigue intentando) ni la suspensión por cobro
    // fallido real (SUSPENDED se bloquea en su propio gate).
    if (oSchool?.bSkipBillingBlock) return false;
    const sModality = normalizeModality(oSchool?.sAccountType);
    const bQuotaStripe = (sModality === 'YOU' || sModality === 'YOU_PLUS') && oSchool?.sPaymentMethod !== 'TRANSFER';
    const bSchoolStripe = sModality === 'SCHOOL' && oSchool?.sPaymentMethod === 'STRIPE' && hasChargeableTariff(oSchool);
    if (!bQuotaStripe && !bSchoolStripe) return false;
    const sStatus = oSchool?.sBillingStatus;
    // Sin tarjeta (NONE): se bloquea de inmediato — "a fuerza con tarjeta".
    if (sStatus === 'NONE') return true;
    // Cancelada: conserva acceso hasta que TERMINE el periodo ya pagado (tCurrentPeriodEnd); recién al
    // vencer se bloquea. Decisión Lucy 2026-10-23: canceló el 20 pero pagó hasta el 15 del mes siguiente,
    // debe entrar hasta el 15 y después quedar como al inicio (pantalla de "agrega tarjeta").
    if (sStatus === 'CANCELED') {
        const tEnd = oSchool?.tCurrentPeriodEnd;
        if (!tEnd) return true;
        return new Date(tEnd).getTime() <= Date.now();
    }
    // TRIALING, ACTIVE y PAST_DUE siguen con acceso. SUSPENDED se bloquea en su propio gate.
    return false;
};

// 402 del gate "a fuerza con tarjeta". Lleva `sCode` (SendAsJson lo agrega a la respuesta) para que
// el front lo distinga de un 402 por suspensión: sin esto, una sesión cuyo estado local no sabe que
// necesita tarjeta (sesión vieja, o el superadmin cambió la tarifa a medio día) se marcaba como
// SUSPENDIDA y rebotaba entre /admin/billing y /admin/suspended.
// ⚠️ NO cambiar `name`: ErrorHandler.mw solo deja pasar `name === 'CustomError'`; otro nombre → 500.
const needsCardError = (sLang: string): MyError => {
    const oError: any = new MyError(402, ErrorMessages.Schools.billingNeedsCard[sLang]);
    oError.sCode = 'BILLING_NEEDS_CARD';
    return oError;
};

type Permission = {
    sModuleName: string;
    sActionCode: 'WRITE' | 'READ' | 'ADMIN' | 'FORBIDDEN';
  };


type TokenData = {
    sUserId: string;
    sSessionId: string;
  };


// Helper function: Verify JWT token asynchronously.
const verifyToken = async (token: string, sLang = 'sp') => {
    try {
        return new Promise((resolve, reject) => {
            JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    throw reject(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
                } else {
                    return resolve(decoded);
                }
            });
        });
    } catch (error) {
        return false;
    }
};


// Used: Refresh Token for 4 more hours.
const refreshToken  = async (resLocals): Promise<void> => {
    await SessionQueries.updateTokenExpiration(resLocals.sSessionId);
    return;
}


// Used: Refresh Token for 120 more hours for Schools.
const refreshTokenSchools  = async (resLocals): Promise<void> => {
    await SessionQueries.updateTokenExpirationSchools(resLocals.sSessionId);
    return;
}


/**
 * Options for the school-user gate.
 */
type SchoolGateOptions = {
    /**
     * Let the request through even when the school is SUSPENDED for non-payment.
     *
     * Set ONLY on the billing endpoints a delinquent school needs in order to pay. The suspension is
     * meant to restrict *"el acceso a la plataforma"* — the students, goals and IEP modules — not the
     * checkout. Blocking the checkout too made suspension a dead end: the 402 message says
     * "regulariza el pago" while every endpoint that could take the payment answered 402.
     * Reported from a DEV test, 2026-08-19.
     */
    bAllowWhenSuspended?: boolean;
};

// Verify is School User .
export const verifySchoolUserPermissions = (sArrModules: Permission[], oOptions: SchoolGateOptions = {}) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang } = res.locals;
    const { authorization } = req.headers;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));

    const bearerToken = authorization.split(' ')[1];
    const encryptedToken: any = await verifyToken(bearerToken);

    // If token does not contain data
    if (!encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }

    const TokenData = Services.DecryptToken(encryptedToken.hash, sLang);

    // School User Session
    let schoolUserSession = await SessionQueries.verifyActiveSessionSchoolUser(TokenData.sSessionId);
    if (!schoolUserSession) return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));

    // Verify that the school exists and is not blocked.
    let mySchool = await SchoolQueries.verifySchoolExists(schoolUserSession.sSchoolId)
    if (!mySchool) {
        return next(new MyError(404, ErrorMessages.Schools.notFoundPermission[sLang]));
    }
    // If school is blocked
    if (mySchool.bBlocked == true) {
        return next(new MyError(404, ErrorMessages.Schools.bBlockedPermission[sLang]));
    }
    // P3 — Suspensión por falta de pago. The contract: once the account is marked delinquent its
    // subscription is suspended "de manera inmediata, sin periodo de gracia, restringiendo el
    // acceso a la plataforma para TODOS los usuarios del colegio". Data is never deleted, and
    // access returns by itself as soon as a charge succeeds and the webhook flips the status back.
    // Only SUSPENDED blocks — NONE (never billed), TRIALING, ACTIVE, PAST_DUE (still in retries)
    // and CANCELED (paid until the cut-off date) all keep working.
    //
    // `bAllowWhenSuspended` exempts the endpoints a suspended school needs in order to pay its way
    // out. See the note on SchoolGateOptions: without it the suspension could never be lifted.
    if (mySchool.sBillingStatus === 'SUSPENDED' && !oOptions.bAllowWhenSuspended) {
        return next(new MyError(402, ErrorMessages.Schools.billingSuspended[sLang]));
    }
    // "A fuerza con tarjeta": You/You+ Stripe sin suscripción activa se bloquean como una suspendida,
    // dejando pasar solo los endpoints de recuperación (bAllowWhenSuspended) para agregar la tarjeta.
    if (!oOptions.bAllowWhenSuspended && schoolNeedsCard(mySchool)) {
        return next(needsCardError(sLang));
    }

    // If NOT super school user then verify permissions.
    if (schoolUserSession.sCreatedBy !== null) {
        // ADMINISTRATION and FACULTY bypass the module-level permission check.
        // SchoolAdmin (sType = ADMINISTRATION) has full access by design; FACULTY access is enforced per-route and per-student in the controllers.
        const sUserSubType = schoolUserSession.sType || 'ADMINISTRATION';
        if (sUserSubType !== 'FACULTY' && sUserSubType !== 'ADMINISTRATION') {
            const isAuthorized = await SchoolUserQueries.bIsSchoolUserAuthorizedForModules(schoolUserSession.sSchoolUserId, sArrModules);
            if (!isAuthorized) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }
    }
    // If Super School User just proceed.
    // Set local variables and refresh token
    res.locals.sSessionId = schoolUserSession.sSessionId;
    res.locals.sUserId = schoolUserSession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'School';
    res.locals.sSchoolId = schoolUserSession.sSchoolId;
    res.locals.sType = schoolUserSession.sType || 'ADMINISTRATION';
    // P5 — the school was already fetched above, so denyTherapistAccess() costs no extra query
    res.locals.sAccountType = (mySchool.sAccountType || 'SCHOOL') as 'SCHOOL' | 'THERAPIST' | 'YOU' | 'YOU_PLUS';
    res.locals.sBillingStatus = (mySchool.sBillingStatus || 'NONE') as typeof res.locals.sBillingStatus;

    // Refresh Token for 120 hours (5 days)
    await refreshTokenSchools(res.locals);
    // Proceed!
    return next();
}


// Deny access to FACULTY users. Place AFTER verifySchoolUserPermissions on routes that FACULTY cannot access.
export const denyFacultyAccess = () => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang, sType } = res.locals;
    if (sType === 'FACULTY') {
        return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    }
    return next();
};


/**
 * P5 — Deny access to THERAPIST accounts.
 *
 * The scope document restricts therapist accounts: they operate as a single user (no additional
 * users), cannot upload documents, and cannot see or use the IEP module. The frontend hides all
 * three, and this enforces them server-side so the restriction is real and not just cosmetic.
 *
 * Place AFTER a school auth middleware — it reads `res.locals.sAccountType`, which those set.
 * Reads only locals, so it adds no database query.
 */

/**
 * Punto 18 — bloquea el acceso (403) para las modalidades indicadas. Reusa el mensaje
 * `therapistNotAllowed`. Ej.: IEP bloqueado para ['YOU','YOU_PLUS']; docs/usuarios para ['YOU'].
 */
export const denyForModality = (aBlocked: string[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang, sAccountType } = res.locals;
    if (aBlocked.includes(normalizeModality(sAccountType))) {
        return next(new MyError(403, ErrorMessages.Schools.therapistNotAllowed[sLang]));
    }
    return next();
};

// Compat: bloquea a las cuentas tipo "You" (terapeuta único). Equivale a denyForModality(['YOU']).
export const denyTherapistAccess = () => denyForModality(['YOU']);


// Verify if School User has ANY of the specified permissions
export const verifySchoolUserHasAnyPermissions = (sArrModules: Permission[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang } = res.locals;
    const { authorization } = req.headers;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));

    const bearerToken = authorization.split(' ')[1];
    const encryptedToken: any = await verifyToken(bearerToken);

    // If token does not contain data
    if (!encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }

    const TokenData = Services.DecryptToken(encryptedToken.hash, sLang);

    // School User Session
    let schoolUserSession = await SessionQueries.verifyActiveSessionSchoolUser(TokenData.sSessionId);
    if (!schoolUserSession) return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));

    // Verify that the school exists and is not blocked.
    let mySchool = await SchoolQueries.verifySchoolExists(schoolUserSession.sSchoolId)
    if (!mySchool) {
        return next(new MyError(404, ErrorMessages.Schools.notFoundPermission[sLang]));
    }
    // If school is blocked
    if (mySchool.bBlocked == true) {
        return next(new MyError(404, ErrorMessages.Schools.bBlockedPermission[sLang]));
    }
    // P3 — Suspensión por falta de pago. The contract: once the account is marked delinquent its
    // subscription is suspended "de manera inmediata, sin periodo de gracia, restringiendo el
    // acceso a la plataforma para TODOS los usuarios del colegio". Data is never deleted, and
    // access returns by itself as soon as a charge succeeds and the webhook flips the status back.
    // Only SUSPENDED blocks — NONE (never billed), TRIALING, ACTIVE, PAST_DUE (still in retries)
    // and CANCELED (paid until the cut-off date) all keep working.
    if (mySchool.sBillingStatus === 'SUSPENDED') {
        return next(new MyError(402, ErrorMessages.Schools.billingSuspended[sLang]));
    }
    // "A fuerza con tarjeta": You/You+ Stripe sin suscripción activa se bloquean hasta agregar tarjeta.
    if (schoolNeedsCard(mySchool)) {
        return next(needsCardError(sLang));
    }

    // If NOT super school user then verify permissions.
    if (schoolUserSession.sCreatedBy !== null) {
        // ADMINISTRATION and FACULTY bypass the module-level permission check.
        // SchoolAdmin (sType = ADMINISTRATION) has full access by design; FACULTY access is enforced per-route and per-student in the controllers.
        const sUserSubType = schoolUserSession.sType || 'ADMINISTRATION';
        if (sUserSubType !== 'FACULTY' && sUserSubType !== 'ADMINISTRATION') {
            // Check if user has ANY of the required permissions (instead of ALL)
            const hasAnyPermission = await SchoolUserQueries.bIsSchoolUserAuthorizedForAnyModules(schoolUserSession.sSchoolUserId, sArrModules);
            if (!hasAnyPermission) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }
    }
    // If Super School User just proceed.

    // Set local variables and refresh token
    res.locals.sSessionId = schoolUserSession.sSessionId;
    res.locals.sUserId = schoolUserSession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'School';
    res.locals.sSchoolId = schoolUserSession.sSchoolId;
    res.locals.sType = schoolUserSession.sType || 'ADMINISTRATION';
    // P5 — the school was already fetched above, so denyTherapistAccess() costs no extra query
    res.locals.sAccountType = (mySchool.sAccountType || 'SCHOOL') as 'SCHOOL' | 'THERAPIST' | 'YOU' | 'YOU_PLUS';
    res.locals.sBillingStatus = (mySchool.sBillingStatus || 'NONE') as typeof res.locals.sBillingStatus;

    // Refresh Token for 120 hours (5 days)
    await refreshTokenSchools(res.locals);
    // Proceed!
    return next();
}
