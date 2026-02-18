import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import AdministratorsQueries from './administrators.queries';
import RecoverySessionQueries from '../003_Authentication/001_RecoverySessions/recoverySession.queries';
import UserQueries from '../004_Users/users.queries';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

// Services
import mailer from '../../Services/Mail.service';
import Services from '../../Services/Index.services';


class Controllers {
    constructor() {
        this.createAdministrator = this.createAdministrator.bind(this);
        this.updateAdministrator = this.updateAdministrator.bind(this);
    };

    // Function to validate administrator modules.
    // NEED to add context binding to constructors. 
    async validateAdministratorModulesExist(sLang, aAdministratorPermissionsSet) {
        const sArrAdministratorModuleIds = aAdministratorPermissionsSet.map(item => item.sAdministratorModuleId);
        const distinctArrAdministratorModuleIds = [...new Set(sArrAdministratorModuleIds)];
        // Check if all distinct UUIDs exist in the Modules table
        const existingModules = await AdministratorsQueries.verifyAdministratorModulesExists(distinctArrAdministratorModuleIds);

        if (existingModules.length !== distinctArrAdministratorModuleIds.length) {
            throw new MyError(404, ErrorMessages.Administrators.modulesNotExist[sLang]);
        }
        return;
    }

    // For setting up a super admin.
    async createAdministrator(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        var { sName, sLastName, sSecondLastName,  sEmail, sPhoneNumber, sPhoneExtension,  aAdministratorPermissionsSet} = req.body;
        // Verify if permissions exist.
        var bExistsPermissions = (aAdministratorPermissionsSet !== undefined && aAdministratorPermissionsSet !== null) && aAdministratorPermissionsSet.length > 0;
        // Verify if the modules exist.
        if (bExistsPermissions) {
            await this.validateAdministratorModulesExist(sLang, aAdministratorPermissionsSet);
        }
        
        sEmail = sEmail.toLowerCase();
        const administratorExists = await UserQueries.getUserByEmail(sEmail);
        
        if(administratorExists) {
            return next(new MyError(404, ErrorMessages.Authentication.signup.userExist[sLang]));
        }

        const newAdmin = await AdministratorsQueries.insertAdmin({
            sName,
            sLastName,
            sSecondLastName,
            sEmail,
            sPhoneNumber,
            sPhoneExtension,
            sCreatedBy: sUserId
        });

        // Insert Permissions.
        const arrPermissions = aAdministratorPermissionsSet.map(item => ({
            sAdministratorId: newAdmin.sAdministratorId,
            sAdministratorModuleId: item.sAdministratorModuleId,
            sActionCode: item.sActionCode,
        }));

        await AdministratorsQueries.insertAdministratorPermissions(arrPermissions);

        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 2880); //48 hours

        // CREATE Recovery Session Token.
        await RecoverySessionQueries.insertTokenByUserId(Token, newAdmin.sUserId, ExpiredDate);

         let sMyUrl = `https://${process.env.NODE_ENV}.${process.env.ENTERPRISES_PLATFORM}/set-password/${Token}`;

        if (process.env.NODE_ENV === 'production') {
            sMyUrl = `https://${process.env.ENTERPRISES_PLATFORM}/set-password/${Token}`
        }

       await mailer.emit('SendEmail', {
            aEmails: [sEmail],
            sSubject: 'Bienvenido a Shipo', 
            oData: {
                sFullName: sName + ' ' + sLastName,
                sUrl: sMyUrl
            },
            sType: 'newAdmin'
        })

        return res.status(201).json({
            message: SuccessMessages.Administrators.createAdministrator[sLang],
            administrator: newAdmin,
        });
    }


    // GET ALL Administrators that are NOT super admin..
    async getAdministrators(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        let { sSearch, iItemsPerPage = 20, iPageNumber = 1, bPlatformAccess } = req.query;
        const arrAdministrators = await AdministratorsQueries.findAllAdministrators(iPageNumber, iItemsPerPage, sSearch, bPlatformAccess);

        const iNumPages = Math.ceil( arrAdministrators.total / Number(iItemsPerPage) );

        return res.status(201).json({
            message: SuccessMessages.Administrators.getAllAdministrators[sLang],
            administrators: arrAdministrators.results,
            iTotal: arrAdministrators.total,
            iNumPages: iNumPages,
            success: true
        })
    }

    // Get ONE Administrator.
    async getOneAdministrator(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sAdministratorId} = req.params;

        // GET One Administratorr
        const myAdministrator = await AdministratorsQueries.findOneAdministrator(sAdministratorId);
        if (!myAdministrator) {return next(new MyError(404, ErrorMessages.Administrators.notFound[sLang]  )) }

        delete myAdministrator.User.sPassword;
        return res.status(201).json({
            message: SuccessMessages.Administrators.getOneAdministrator[sLang],
            administrator: myAdministrator,
            success: true
        })
    }

    // Updates an Administrator.
     async updateAdministrator(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        const {sAdministratorId} = req.params;
        var { sName, sLastName, sSecondLastName, sPhoneNumber, sPhoneExtension,  aAdministratorPermissionsSet} = req.body;

         // Verify if permissions exist.
         var bExistsPermissions = (aAdministratorPermissionsSet !== undefined && aAdministratorPermissionsSet !== null) && aAdministratorPermissionsSet.length > 0;
         // Verify if the modules exist.
         if (bExistsPermissions) {
             await this.validateAdministratorModulesExist(sLang, aAdministratorPermissionsSet);
         }
         
        // Validate that the Administrator that we wish to update exists.
        const myAdministrator = await AdministratorsQueries.verifyAdministratorExists(sAdministratorId);
        if (!myAdministrator) {return next(new MyError(404, ErrorMessages.Administrators.notFound[sLang]  )) }

        // Format Permissions.
        aAdministratorPermissionsSet = aAdministratorPermissionsSet.map(item => ({
            sAdministratorId: sAdministratorId,
            sAdministratorModuleId: item.sAdministratorModuleId,
            sActionCode: item.sActionCode,
        }));
        // Update Administrator
        const updatedAdministrator = await AdministratorsQueries.updateAdministrator(sAdministratorId, { sUserId, sName, sLastName, sSecondLastName, sPhoneNumber, sPhoneExtension,  aAdministratorPermissionsSet});
        delete updatedAdministrator.User.sPassword;

        return res.status(201).json({
            message: SuccessMessages.Administrators.updateAdministrator[sLang],
            updatedAdministrator: updatedAdministrator,
            success: true
        })
    }

     // Patches Administrator bPlatformAccess.
     async patchAdministratorAccess(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sAdministratorId} = req.params;
        const {bPlatformAccess} = req.body;

        // Validate that the Administrator that we wish to update exists.
        const myAdministrator = await AdministratorsQueries.verifyAdministratorExists(sAdministratorId);
        if (!myAdministrator) {return next(new MyError(404, ErrorMessages.Administrators.notFound[sLang]  )) }

        // Patch Administrator bPlatformAccess
        const updatedAdministrator = await AdministratorsQueries.patchPlatformAccess(sAdministratorId, bPlatformAccess);
        delete updatedAdministrator.User.sPassword;
        
        return res.status(201).json({
            message: SuccessMessages.Administrators.patchAdministratorAccess[sLang],
            updatedAdministrator: updatedAdministrator,
            success: true
        })
    }


    // Delete Administrator.
    async deleteAdministrator(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sAdministratorId} = req.params;
        // Validate that the Administrator that we wish to update exists.
        const myAdministrator = await AdministratorsQueries.verifyAdministratorExists(sAdministratorId);
        if (!myAdministrator) {return next(new MyError(404, ErrorMessages.Administrators.notFound[sLang]  )) }

        // Delete  Administrator
        const deletedAdministrator = await AdministratorsQueries.deleteAdministrator(sAdministratorId);
        
        return res.status(201).json({
            message: SuccessMessages.Administrators.deleteAdministrator[sLang],
            success: true
        })
    }



}

export default new Controllers();