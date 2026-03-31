import { Response, Request, NextFunction } from 'express';
import MyError from '../../Middlewares/Error.mw';
import SchoolUserCrudQueries from './schoolUsers.queries';
import SchoolQueries from '../022_Schools/schools.queries';
import RecoverySessionQueries from '../003_Authentication/001_RecoverySessions/recoverySession.queries';
import SessionQueries from '../003_Authentication/002_Sessions/sessions.queries';
import Services from '../../Services/Index.services';
import mailer from '../../Services/Mail.service';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {};

    // GET /schoolUsers — List school users
    async getAllSchoolUsers(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {iPageNumber = 1, iItemsPerPage = 10, sSearch, sType, bActive} = req.query;

        const myUsers = await SchoolUserCrudQueries.findAllSchoolUsers(sSchoolId, iPageNumber, iItemsPerPage, sSearch, sType, bActive);
        const iCurrentUsers = await SchoolUserCrudQueries.countActiveSchoolUsers(sSchoolId);
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);

        return res.status(200).json({
            message: SuccessMessages.SchoolUsersCrud.getAllUsers[sLang],
            aData: myUsers.results,
            iTotalItems: myUsers.total,
            iCurrentUsers,
            iMaxUsers: mySchool?.iUsersLimit || 0,
            success: true
        });
    }

    // POST /schoolUsers — Create school user
    async createSchoolUser(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sName, sLastName, sSecondLastName, sEmail, sType} = req.body;

        // Check user limit
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {
            return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        }
        const iCurrentUsers = await SchoolUserCrudQueries.countActiveSchoolUsers(sSchoolId);
        if (iCurrentUsers >= mySchool.iUsersLimit) {
            return next(new MyError(403, ErrorMessages.SchoolUsers.limitReached[sLang]));
        }

        // Check email uniqueness within school
        const existingUser = await SchoolUserCrudQueries.emailExistsInSchool(sSchoolId, sEmail);
        if (existingUser) {
            return next(new MyError(400, ErrorMessages.SchoolUsers.emailAlreadyExists[sLang]));
        }

        // Create user
        const newUser = await SchoolUserCrudQueries.insertSchoolUser(sSchoolId, {
            sName, sLastName, sSecondLastName, sEmail, sType, sCreatedBy: sUserId
        });

        // Generate recovery token for initial setup
        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 4320); // 72 hours
        await RecoverySessionQueries.insertTokenByUserId(Token, newUser.sUserId, ExpiredDate);

        // Send invitation email
        let sMyUrl = `https://${process.env.NODE_ENV}.${process.env.SCHOOLS_PLATFORM}/set-password/${Token}`;
        if (process.env.NODE_ENV === 'production') {
            sMyUrl = `https://${process.env.SCHOOLS_PLATFORM}/set-password/${Token}`;
        }

        await mailer.emit('SendEmail', {
            aEmails: [sEmail],
            sSubject: 'Bienvenido a MyVillage',
            oData: {
                sFullName: sName,
                sUrl: sMyUrl
            },
            sType: 'newSchool'
        });

        return res.status(201).json({
            message: SuccessMessages.SchoolUsersCrud.createUser[sLang],
            oData: {
                sSchoolUserId: newUser.sUserId,
                sName: newUser.sName,
                sLastName: newUser.sLastName,
                sSecondLastName: newUser.sSecondLastName,
                sEmail: newUser.sEmail,
                sType,
                bVerified: false,
                bActive: true
            },
            success: true
        });
    }

    // GET /schoolUsers/:sSchoolUserId — Get one school user
    async getOneSchoolUser(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sSchoolUserId} = req.params;

        const myUser = await SchoolUserCrudQueries.findOneSchoolUser(sSchoolId, sSchoolUserId);
        if (!myUser) {
            return next(new MyError(404, ErrorMessages.SchoolUsers.notFound[sLang]));
        }

        return res.status(200).json({
            message: SuccessMessages.SchoolUsersCrud.getOneUser[sLang],
            oData: myUser,
            success: true
        });
    }

    // PUT /schoolUsers/:sSchoolUserId — Update school user
    async updateSchoolUser(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sSchoolUserId} = req.params;
        const {sName, sLastName, sSecondLastName, sType, bActive} = req.body;

        // Verify user belongs to school
        const myUser = await SchoolUserCrudQueries.findOneSchoolUser(sSchoolId, sSchoolUserId);
        if (!myUser) {
            return next(new MyError(404, ErrorMessages.SchoolUsers.notFound[sLang]));
        }

        // Guard: main admin (sCreatedBy IS NULL) cannot have sType changed
        if (myUser.sCreatedBy === null || myUser.sCreatedBy === undefined) {
            if (sType && sType !== 'ADMINISTRATION') {
                return next(new MyError(403, ErrorMessages.SchoolUsers.cannotChangeMainAdminType[sLang]));
            }
            if (bActive === false) {
                return next(new MyError(403, ErrorMessages.SchoolUsers.cannotDeleteMainAdmin[sLang]));
            }
        }

        await SchoolUserCrudQueries.updateSchoolUser(sSchoolUserId, {
            sName, sLastName, sSecondLastName, sType, bActive, sLastUpdatedBy: sUserId
        });

        // If deactivating, kill all sessions for this user
        if (bActive === false) {
            await SessionQueries.deleteAllSessionsByUserId(sSchoolUserId);
        }

        return res.status(200).json({
            message: SuccessMessages.SchoolUsersCrud.updateUser[sLang],
            success: true
        });
    }

    // POST /schoolUsers/:sSchoolUserId/resetPassword — Reset password
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sSchoolUserId} = req.params;

        // Verify user belongs to school
        const myUser = await SchoolUserCrudQueries.findOneSchoolUser(sSchoolId, sSchoolUserId);
        if (!myUser) {
            return next(new MyError(404, ErrorMessages.SchoolUsers.notFound[sLang]));
        }

        // Generate reset token
        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 1440); // 24 hours
        await RecoverySessionQueries.insertTokenByUserId(Token, sSchoolUserId, ExpiredDate);

        // Send reset email
        let sMyUrl = `https://${process.env.NODE_ENV}.${process.env.SCHOOLS_PLATFORM}/set-password/reset-${Token}`;
        if (process.env.NODE_ENV === 'production') {
            sMyUrl = `https://${process.env.SCHOOLS_PLATFORM}/set-password/reset-${Token}`;
        }

        await mailer.emit('SendEmail', {
            aEmails: [myUser.sEmail],
            sSubject: 'Restablece tu contraseña - MyVillage',
            oData: {
                sFullName: myUser.sName,
                sUrl: sMyUrl
            },
            sType: 'forgotPassword'
        });

        return res.status(200).json({
            message: SuccessMessages.SchoolUsersCrud.resetPassword[sLang],
            success: true
        });
    }
}

export default new Controllers();
