import { Response, Request, NextFunction } from 'express';
import MyError from '../../Middlewares/Error.mw';
import { UsersModel } from '../004_Users/users.model';
import AuthServices from '../003_Authentication/authentication.services';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {};

    // GET /profile — Get own profile
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;

        const user = await UsersModel.query().findById(sUserId).where('bActive', true);
        if (!user) {
            return next(new MyError(404, ErrorMessages.Profile.userNotFound[sLang]));
        }

        return res.status(200).json({
            message: SuccessMessages.Profile.getProfile[sLang],
            oData: {
                sName: user.sName,
                sLastName: user.sLastName,
                sSecondLastName: user.sSecondLastName,
                sEmail: user.sEmail,
                sPhone: user.sPhoneNumber || ''
            },
            success: true
        });
    }

    // PUT /profile — Update own profile
    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        const {sName, sPhone} = req.body;

        await UsersModel.query().patchAndFetchById(sUserId, {
            sName,
            sPhoneNumber: sPhone || null
        }).where('bActive', true);

        return res.status(200).json({
            message: SuccessMessages.Profile.updateProfile[sLang],
            success: true
        });
    }

    // PUT /profile/password — Change own password
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        const {sCurrentPassword, sNewPassword, sConfirmPassword} = req.body;

        // Get current user with password
        const user = await UsersModel.query().findById(sUserId).where('bActive', true).context({ keepPassword: true });
        if (!user || !user.sPassword) {
            return next(new MyError(400, ErrorMessages.Profile.userNotFound[sLang]));
        }

        // Verify current password
        const bCorrect = await AuthServices.comparePassword(sCurrentPassword, user.sPassword);
        if (!bCorrect) {
            return next(new MyError(400, ErrorMessages.Profile.wrongPassword[sLang]));
        }

        // Verify passwords match
        if (sNewPassword !== sConfirmPassword) {
            return next(new MyError(400, ErrorMessages.Profile.passwordsDontMatch[sLang]));
        }

        // Hash and store new password
        const sHashedPassword = await AuthServices.HashPassword(sNewPassword, sLang);
        await UsersModel.query().patch({
            sPassword: sHashedPassword
        }).where('sUserId', sUserId).andWhere('bActive', true);

        return res.status(200).json({
            message: SuccessMessages.Profile.changePassword[sLang],
            success: true
        });
    }
}

export default new Controllers();
