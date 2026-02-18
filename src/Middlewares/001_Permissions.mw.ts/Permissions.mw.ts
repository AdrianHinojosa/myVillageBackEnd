import MyError from '../Error.mw';
import { Response, Request, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import Services from '../../Services/Index.services';
import SessionQueries from '../../Api/003_Authentication/002_Sessions/sessions.queries';
import AdministratorQueries from '../../Api/005_Administrators/administrators.queries';
import {IAdministrators} from '../../Api/005_Administrators/administrators.model';

import ErrorMessages from '../../Utils/ErrorMessages.util';

/**@Required - Actualizar interface al agregar variables a los locales de Response */
declare module 'express' {
    export interface Response {
        locals: {
            sSessionId: string;
            sUserId: string;
            sLang: 'sp' | 'en';
            TokenData: object;
            sTypeUser: 'User' | 'Administrator' | 'Enterprise' | 'Customer' | 'School'
            sEnterpriseId?: string;
            sEmployeeId?: string;
            sSchoolId?: string;

        }
    }
}

type Permission = {
    sModuleName: string;
    sActionCode: 'WRITE' | 'READ' | 'DELETE' | 'FORBIDDEN';
  };


type TokenData = {
    sUserId: string;
    sSessionId: string;
  };


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


// Used: Refresh Token for 4 more hours.
const refreshToken  = async (resLocals): Promise<void> => {
    await SessionQueries.updateTokenExpiration(resLocals.sSessionId);
    return;
}


// Used: Refresh Token for 240 more hours.
const refreshTokenPlayers  = async (resLocals): Promise<void> => {
    await SessionQueries.updateTokenExpirationPlayers(resLocals.sSessionId);
    return;
}




// Used. Verify that the user performing the request has a valid token.
export const verifyOwnUser = () => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {sLang} = res.locals;
    const {authorization} = req.headers;
    const {sUserId} = req.params;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    const bearerToken = authorization.split(' ')[1];
    const encryptedToken : any = await verifyToken(bearerToken);
    if (!encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }
    const TokenData : TokenData  = Services.DecryptToken(encryptedToken.hash, sLang);
    // If trying to create the request as another user. Error.
    if (TokenData.sUserId !== sUserId) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    // Find that the session is valid.
    let mySession : any = await SessionQueries.verifyActiveSession(TokenData.sSessionId)
    // Verify that the session is active, has not expired and the user within the session is active.
    if (!mySession) return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));
    // Save sessionId
    res.locals.sSessionId = mySession.sSessionId;
    res.locals.sUserId = mySession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'User';
    await refreshToken(res.locals)
    return next();
}


// Used. Verify if an admin has permissions or if is super admin.
export const verifyAdminPermissions = (sArrModules: Permission[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    let adminSession = await SessionQueries.verifyActiveSessionAdmin(TokenData.sSessionId);
    if (!adminSession) return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));
   
    // If NOT super admin then verify permissions.
    if (adminSession.sCreatedBy !== null) {
        const isAuthorized = await AdministratorQueries.bIsAdminAuthorizedForModules(adminSession.sAdministratorId, sArrModules);
        if (!isAuthorized) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    }
    console.log('Admin session and permissions verified successfully.');
    console.log(adminSession)

    // If Super Admin just proceed.
    res.locals.sSessionId = adminSession.sSessionId;
    // Prefer session user id, fallback to token user id to avoid empty audit fields.
    res.locals.sUserId = adminSession.sUserId || TokenData.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'Administrator';

    await refreshToken(res.locals);
    return next();
}


// Verify if the own administrator or has permissions.
export const verifyOwnAdminOrAdminPermissions = (sArrModules: Permission[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang } = res.locals;
    const {sAdministratorId} = req.params;
    const { authorization } = req.headers;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    const bearerToken = authorization.split(' ')[1];
    const encryptedToken: any = await verifyToken(bearerToken);
    
    if (!encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }
    const TokenData = Services.DecryptToken(encryptedToken.hash, sLang);
    
    let adminSession = await SessionQueries.verifyActiveSessionAdmin(TokenData.sSessionId);
    if (!adminSession) return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));
   
    // If the OWN admin is trying to get itself, allow.
    if (TokenData.sUserId == sAdministratorId) {
        res.locals.sSessionId = adminSession.sSessionId;
        res.locals.sUserId = adminSession.sUserId;
        res.locals.TokenData = TokenData;
        res.locals.sTypeUser = 'Administrator';
        await refreshToken(res.locals);
        return next();
    }

    // If NOT super admin and NOT own user, then verify permissions.
    if (adminSession.sCreatedBy !== null) {
        const isAuthorized = await AdministratorQueries.bIsAdminAuthorizedForModules(adminSession.sAdministratorId, sArrModules);
        if (!isAuthorized) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
    }

    // If Super Admin just proceed.
    res.locals.sSessionId = adminSession.sSessionId;
    res.locals.sUserId = adminSession.sUserId;
    res.locals.TokenData = TokenData;
    res.locals.sTypeUser = 'Administrator';
    await refreshToken(res.locals);
    return next();
}


// VERIFY that is a valid user and check what type of user it is
export const verifyIsUserAndUserType = () => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sLang } = res.locals;
    const { authorization } = req.headers;
    if (!authorization) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    const bearerToken = authorization.split(' ')[1];
    const encryptedToken: any = await verifyToken(bearerToken);
    
    if (!encryptedToken.hash) {
        return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
    }
    const TokenData = Services.DecryptToken(encryptedToken.hash, sLang);

    //  =========== START Verifications =======================
    // OPTION 1: Verify if the session belongs to an admin:
    let adminSession = await SessionQueries.verifyActiveSessionAdmin(TokenData.sSessionId);
    if (adminSession) {
        res.locals.sSessionId = adminSession.sSessionId;
        res.locals.sUserId = adminSession.sUserId;
        res.locals.TokenData = TokenData;
        res.locals.sTypeUser = 'Administrator';
        await refreshToken(res.locals);
    }
    // Verify if the session belongs to a sporcenter
     let sportCenterSession = await SessionQueries.verifyActiveSessionSportCenter(TokenData.sSessionId);
     if (sportCenterSession)  {
        // Set local variables and refresh token
        res.locals.sSessionId = sportCenterSession.sSessionId;
        res.locals.sUserId = sportCenterSession.sUserId;
        res.locals.TokenData = TokenData;
        res.locals.sTypeUser = 'SportCenter';
        await refreshToken(res.locals);
        return next();
     }

    // Verify if the session belongs to a player
    let playerSession = await SessionQueries.verifyActiveSessionPlayer(TokenData.sSessionId);
    if (playerSession)  {
         // Set local variables and refresh token
         res.locals.sSessionId = playerSession.sSessionId;
         res.locals.sUserId = playerSession.sUserId;
         res.locals.TokenData = TokenData;
         res.locals.sTypeUser = 'Player';
         await refreshTokenPlayers(res.locals);
         return next();
    }

    //  =========== END Verifications =======================

    // If we have not proceeded it means that the session does not belong to any type of user that can use this route.
    return next(new MyError(401, ErrorMessages.Authentication.undefinedToken[sLang]));
}
