import { Response, Request, NextFunction } from 'express';
import UserQueries from '../004_Users/users.queries';
import AdministratorQueries from '../005_Administrators/administrators.queries';
import SessionQueries from './002_Sessions/sessions.queries';
import RecoverySessionQueries from './001_RecoverySessions/recoverySession.queries';
import MyError  from '../../Middlewares/Error.mw';
import Services from '../../Services/Index.services';
import mailer from '../../Services/Mail.service';

import AuthServices from './authentication.services'

import { SchoolUsersModel } from '../022_Schools/001_SchoolUsers/schoolUsers.model';
import SchoolQueries from '../022_Schools/schools.queries';

import ErrorMessages from '../../Utils/ErrorMessages.util'
import SuccessMessages from '../../Utils/SuccessMessage.util'


class Controllers {
    constructor() {

    };

    // Used: Login user and create a session.
    async login(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sEmail, sPassword} = req.body;
        let User = await UserQueries.getUserByEmail(sEmail);
        // Invalid credentials
        if (!User) return next(new MyError(401, ErrorMessages.Authentication.login.invalidCredentials[sLang]));

        if (User.sPassword == null) {
            return next(new MyError(401, ErrorMessages.Authentication.login.notActivatedAccount[sLang]));
        }

        let bCorrectPass = await AuthServices.comparePassword(sPassword, User.sPassword);
        if (!bCorrectPass) return next(new MyError(401, ErrorMessages.Authentication.login.invalidCredentials[sLang]));

        if (User.bPlatformAccess == false) {
            return next(new MyError(401, ErrorMessages.Authentication.login.blockedFromPlatform[sLang]));
        }

        // If not verified email
        if (User.bVerified == false) {
            return next(new MyError(401, ErrorMessages.Authentication.login.notActivatedAccount[sLang]));
        }

        // Determine user type: SuperAdmin or SchoolAdmin
        let sUserType: 'SuperAdmin' | 'SchoolAdmin';
        let oSchool: any = null;
        let iTokenExpiryMinutes: number;

        // Check if user is an Administrator
        const myAdmin = await AdministratorQueries.verifyAdministratorExists(User.sUserId);

        if (myAdmin) {
            sUserType = 'SuperAdmin';
            iTokenExpiryMinutes = 240; // 4 hours
        } else {
            // Check if user is a SchoolUser
            const mySchoolUser = await SchoolUsersModel.query().findById(User.sUserId);

            if (mySchoolUser) {
                sUserType = 'SchoolAdmin';
                iTokenExpiryMinutes = 7200; // 120 hours

                // Get school info (verifySchoolExists checks bActive=true AND bBlocked=false)
                const school = await SchoolQueries.verifySchoolExists(mySchoolUser.sSchoolId);
                if (!school) {
                    return next(new MyError(401, ErrorMessages.Authentication.login.blockedFromPlatform[sLang]));
                }
                oSchool = {
                    sSchoolId: school.sSchoolId,
                    sSchoolName: school.sName,
                    sSchoolLogo: school.sImageKey || '',
                    oImages: school.oImages || null
                };
            } else {
                return next(new MyError(401, ErrorMessages.Authentication.login.invalidCredentials[sLang]));
            }
        }

        // Set token expiry
        let tExpiresAt = await AuthServices.getExpireToken(new Date(), iTokenExpiryMinutes);

        // Create Session
        const newSession = await SessionQueries.insertSession({
            sUserId: User.sUserId,
            tExpiresAt: tExpiresAt
        });

        // Create token.
        let newToken =  await AuthServices.createToken({
            sUserId: User.sUserId,
            sSessionId: newSession.sSessionId
        })

        // Build response
        const results: any = {
            sUserId: User.sUserId,
            sToken: newToken,
            sEmail: User.sEmail,
            sFullName: `${User.sName} ${User.sLastName}`,
            sUserType
        };

        if (oSchool) {
            results.oSchool = oSchool;
        }

        return res.status(200).json({
            message: SuccessMessages.Authentication.login.welcome(`${User.sName} ${User.sLastName}`, sLang),
            status: true,
            results
        })
    }

    // Used: Logout user and kill a session.
    async logout(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSessionId} = res.locals;
        const deletedSession = await SessionQueries.deleteSession(sSessionId);
        if (!deletedSession) return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
        return res.status(200).json({
            message: SuccessMessages.Authentication.session.logout[sLang],
            status: true
        })
    }


    // Used: Send recovery token
    async sendRecoveryToken(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sEmail} = req.body;

        let User = await UserQueries.getUserByEmail(sEmail);
        // Invalid credentials
        if (!User) return next(new MyError(401, ErrorMessages.Authentication.recovery.notFoundEmail[sLang]));

        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 2880); //48 hours

        // CREATE Recovery Session Token.
        await RecoverySessionQueries.insertTokenByUserId(Token, User.sUserId, ExpiredDate);

        // Determine which platform URL to use based on user type
        let sPlatformDomain: string;
        const myAdmin = await AdministratorQueries.verifyAdministratorExists(User.sUserId);
        if (myAdmin) {
            sPlatformDomain = process.env.ADMIN_PLATFORM;
        } else {
            sPlatformDomain = process.env.SCHOOLS_PLATFORM;
        }

        let sMyUrl = `https://${process.env.NODE_ENV}.${sPlatformDomain}/reset-password/${Token}`;

        if (process.env.NODE_ENV === 'production') {
            sMyUrl = `https://${sPlatformDomain}/reset-password/${Token}`
        }

        await mailer.emit('SendEmail', {
            aEmails: [sEmail],
            sSubject: 'Recupera tu contraseña',
            oData: {
                sFullName: `${User.sName} ${User.sLastName}`,
                sUrl: sMyUrl
            },
            sType: 'forgotPassword'
        })

        return res.status(200).json({
            message: SuccessMessages.Authentication.requestRecovery[sLang],
            status: true
        })

    }


    // Used. Set password by a given token.
    async setPasswordByToken(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        const { sNewPassword, sConfirmNewPassword, sToken} = req.body;
        const myToken = await RecoverySessionQueries.verifyRecoveryToken(sToken.toString());
        if (!myToken) return next(new MyError(404,  ErrorMessages.Authentication.recovery.tokenNotFound[sLang]));

        if (String(sNewPassword) !== String(sConfirmNewPassword) ) {
            return next(new MyError(404,  ErrorMessages.Authentication.recovery.passwordsDontMatch[sLang]));
        }

        let sTargetPassword = await AuthServices.HashPassword(sNewPassword, sLang);

        // Change user passwword.
        await UserQueries.patchPasswordByUserId({
            sUserId: myToken.sUserId,
            sPassword: sTargetPassword
        });

        // Logically delete all sessions from that User.
        await SessionQueries.deleteAllSessionsByUserId(myToken.sUserId);

        // Logically delete all recovery tokens from that user.
        await RecoverySessionQueries.deleteAllTokensByUserId(myToken.sUserId)

        return res.status(200).json({
            message: SuccessMessages.Authentication.recovery[sLang],
            status: true,
            results: {
                redirect: process.env.HOME_PAGE
            }
        })
    }


    // Used. Verify user by a given token.
    async verifyUserByToken(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        const {sToken} = req.params;
        const myToken = await RecoverySessionQueries.verifyRecoveryToken(sToken.toString());
        if (!myToken) return next(new MyError(404,  ErrorMessages.Authentication.recovery.tokenNotFound[sLang]));

        // Logically delete all recovery tokens from that user.
        await RecoverySessionQueries.deleteAllTokensByUserId(myToken.sUserId)

        // Mark User as verified.
        await UserQueries.patchUserVerification({
            sUserId: myToken.sUserId
        });

        // Redirect to the login URL.
        return res.redirect(process.env.LOGIN_URI);
    }

}

export default new Controllers();
