import MyError from '../Error.mw';
import { Response, Request, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import Services from '../../Services/Index.services';
import SessionQueries from '../../Api/003_Authentication/002_Sessions/sessions.queries';
import SchoolQueries from '../../Api/022_Schools/schools.queries';

import ErrorMessages from '../../Utils/ErrorMessages.util';


// Helper function: Verify JWT token asynchronously.
const verifyToken = async (token: string): Promise<any | false> => {
    if (!token) return false;
    try {
        return await new Promise((resolve) => {
            JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return resolve(false);
                }
                return resolve(decoded);
            });
        });
    } catch (error) {
        return false;
    }
};


/**
 * Verify that the request comes from ANY authenticated user, regardless of audience.
 *
 * School users (SchoolAdmin / FACULTY) and Administrators (SuperAdmin) live in different tables
 * and are validated by different middlewares (`verifySchoolUserPermissions` vs
 * `verifyAdminPermissions`), so neither one alone can gate an endpoint that must serve both.
 * This middleware resolves the session against both audiences and populates `res.locals`
 * with the same shape each specific middleware would have set.
 *
 * Use ONLY for endpoints that are genuinely audience-agnostic (e.g. support tickets).
 * Anything that touches school data must keep using `verifySchoolUserPermissions`, which
 * enforces module permissions and the school block.
 *
 * NOTE: unlike `verifySchoolUserPermissions`, this gate deliberately does NOT reject users of a
 * blocked school, nor of a school SUSPENDED for non-payment (P3). Either state locks the school out
 * of every other endpoint, so refusing support tickets too would leave them with no way to ask for
 * help — precisely when they most need it, since "my account is suspended" is the likeliest reason
 * they are writing in. A valid session is still required, and the endpoint only sends an email.
 */
export const verifyAnyAuthenticatedUser = () => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang } = res.locals;
    const { authorization } = req.headers;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));

    const bearerToken = authorization.split(' ')[1];
    if (!bearerToken) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));

    const encryptedToken: any = await verifyToken(bearerToken);
    if (!encryptedToken || !encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }

    const TokenData = Services.DecryptToken(encryptedToken.hash, sLang);

    // Try the School audience first (the vast majority of traffic).
    const schoolUserSession = await SessionQueries.verifyActiveSessionSchoolUser(TokenData.sSessionId);
    if (schoolUserSession) {
        const mySchool = await SchoolQueries.verifySchoolExists(schoolUserSession.sSchoolId);
        if (!mySchool) {
            return next(new MyError(404, ErrorMessages.Schools.notFoundPermission[sLang]));
        }

        res.locals.sSessionId = schoolUserSession.sSessionId;
        res.locals.sUserId = schoolUserSession.sUserId;
        res.locals.TokenData = TokenData;
        res.locals.sTypeUser = 'School';
        res.locals.sSchoolId = schoolUserSession.sSchoolId;
        res.locals.sType = schoolUserSession.sType || 'ADMINISTRATION';
        // P5 — account type, for parity with the school-only middlewares
        res.locals.sAccountType = (mySchool.sAccountType || 'SCHOOL') as 'SCHOOL' | 'THERAPIST';

        // Refresh Token for 120 hours (5 days)
        await SessionQueries.updateTokenExpirationSchools(res.locals.sSessionId);
        return next();
    }

    // Fall back to the Administrator audience.
    const adminSession = await SessionQueries.verifyActiveSessionAdmin(TokenData.sSessionId);
    if (adminSession) {
        res.locals.sSessionId = adminSession.sSessionId;
        // Prefer session user id, fallback to token user id to avoid empty audit fields.
        res.locals.sUserId = adminSession.sUserId || TokenData.sUserId;
        res.locals.TokenData = TokenData;
        res.locals.sTypeUser = 'Administrator';

        // Refresh Token for 4 hours
        await SessionQueries.updateTokenExpiration(res.locals.sSessionId);
        return next();
    }

    // Neither audience recognised the session.
    return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));
}
