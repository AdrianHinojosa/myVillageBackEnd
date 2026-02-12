import MyError from '../Error.mw';
import { Response, Request, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import Services from '../../Services/Index.services';
import SessionQueries from '../../Api/003_Authentication/002_Sessions/sessions.queries';
import SchoolUserQueries from '../../Api/022_Schools/001_SchoolUsers/schoolUsers.queries';
import SchoolQueries from '../../Api/022_Schools/schools.queries';

import {IAdministrators} from '../../Api/005_Administrators/administrators.model';

import ErrorMessages from '../../Utils/ErrorMessages.util';

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


// Verify is School User .
export const verifySchoolUserPermissions = (sArrModules: Permission[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // If NOT super school user then verify permissions.
    if (schoolUserSession.sCreatedBy !== null) {
        const isAuthorized = await SchoolUserQueries.bIsSchoolUserAuthorizedForModules(schoolUserSession.sSchoolUserId, sArrModules);
        if (!isAuthorized) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    }
    // If Super School User just proceed.
    // Set local variables and refresh token
    res.locals.sSessionId = schoolUserSession.sSessionId;
    res.locals.sUserId = schoolUserSession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'School';
    res.locals.sSchoolId = schoolUserSession.sSchoolId;

    // Refresh Token for 120 hours (5 days)
    await refreshTokenSchools(res.locals);
    // Proceed!
    return next();
}


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

    // If NOT super school user then verify permissions.
    if (schoolUserSession.sCreatedBy !== null) {
        // Check if user has ANY of the required permissions (instead of ALL)
        const hasAnyPermission = await SchoolUserQueries.bIsSchoolUserAuthorizedForAnyModules(schoolUserSession.sSchoolUserId, sArrModules);
        if (!hasAnyPermission) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    }
    // If Super School User just proceed.

    // Set local variables and refresh token
    res.locals.sSessionId = schoolUserSession.sSessionId;
    res.locals.sUserId = schoolUserSession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'School';
    res.locals.sSchoolId = schoolUserSession.sSchoolId;

    // Refresh Token for 120 hours (5 days)
    await refreshTokenSchools(res.locals);
    // Proceed!
    return next();
}
