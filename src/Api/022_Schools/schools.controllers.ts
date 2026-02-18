import { Response, Request, NextFunction } from 'express';
import SchoolQueries from './schools.queries';
import UserQueries from '../004_Users/users.queries';
import RecoverySessionQueries from '../003_Authentication/001_RecoverySessions/recoverySession.queries';
import MyError  from '../../Middlewares/Error.mw';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';
import Services from '../../Services/Index.services';
import mailer from '../../Services/Mail.service';
import StorageServices from '../../Services/Storage.services';

class Controllers {
    constructor() {
    };

    // Create a school
    async createSchool(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        var {
            // School Info
            sName,
            sPhone,
            iUsersLimit,
            iStudentsLimit,

            // User info
            sAdminName,
            sLastName,
            sSecondLastName,
            sEmail,
        } = req.body;

        sEmail = sEmail.toLowerCase();
        const userExists = await UserQueries.getUserByEmail(sEmail);

        if(userExists) {
            return next(new MyError(404, ErrorMessages.Authentication.signup.userExist[sLang]));
        }

        const sCreatedBy = res.locals.sUserId;
        if (!sCreatedBy) {
            return next(new MyError(401, ErrorMessages.Authentication.invalidToken[sLang]));
        }

        const myObject = await SchoolQueries.insertSchool({sName, sPhone, sEmail, sAddress: null, sCityId: null, iUsersLimit, iStudentsLimit, sCreatedBy, sAdminName, sLastName, sSecondLastName});

        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 4320); //72 hours
        // CREATE Recovery Session Token.
        await RecoverySessionQueries.insertTokenByUserId(Token, myObject.user.sUserId, ExpiredDate);

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
        })


        return res.status(201).json({
            message: SuccessMessages.Schools.createSchool[sLang],
            school: myObject.school,
        });
    }


    // Get ALL Schools.
    async getAllSchools(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {iPageNumber, iItemsPerPage, sSearch, bBlocked} = req.query;

        // GET ALL schools
        const mySchools = await SchoolQueries.findAllSchools(iPageNumber, iItemsPerPage, sSearch, bBlocked);
        const iNumPages = Math.ceil( mySchools.total / Number(iItemsPerPage) );

        return res.status(201).json({
            message: SuccessMessages.Schools.getAllSchools[sLang],
            schools: mySchools.results,
            iTotal: mySchools.total,
            iNumPages: iNumPages,
            success: true
        })
    }

     // Get ONE school
     async getOneSchool(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sSchoolId} = req.params;

        // GET One school
        const mySchool = await SchoolQueries.findOneSchool(sSchoolId);
        if (!mySchool) {return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]  )) }

        return res.status(201).json({
            message: SuccessMessages.Schools.getOneSchool[sLang],
            school: mySchool,
            success: true
        })
    }


    // Updates a school.
    async updateSchool(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sSchoolId} = req.params;
        const {
            // School Info
            sName,
            sPhone,
            iUsersLimit,
            iStudentsLimit,
        } = req.body;

        // Validate that the school Exists
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]  )) }

        const sLastUpdatedBy = res.locals.sUserId;

        // Update school
        const updatedSchool = await SchoolQueries.updateSchool(sSchoolId, { sName, sPhone, sCityId: null, iUsersLimit, iStudentsLimit, sLastUpdatedBy })

        return res.status(201).json({
            message: SuccessMessages.Schools.updateSchool[sLang],
            school: updatedSchool,
            success: true
        })
    }


    // DELETES a school.
    async deleteSchool(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sSchoolId} = req.params;

        // Validate that the school Exists
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]  )) }

        const sLastDeletedBy = res.locals.sUserId;

        // DELETE school
        const deletedSchool = await SchoolQueries.deleteSchool(sSchoolId, sLastDeletedBy)

        return res.status(201).json({
            message: SuccessMessages.Schools.deleteSchool[sLang],
            success: true
        })
    }


    // Toggle bBlocked.
    async patchSchoolBlocked(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sSchoolId} = req.params;
        const {bBlocked} = req.body;

        // Validate that the school Exists
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]  )) }

        // Block school
        const blockedSchool = await SchoolQueries.patchSchoolBlocked(sSchoolId, bBlocked)

        return res.status(201).json({
            message: SuccessMessages.Schools.patchBlocked[sLang],
            school: blockedSchool.school,
            success: true
        })
    }


    // Creates/Updates School Logo
    async uploadSchoolImage(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sSchoolId} = req.params;
        var {bDeleteImage} = req.body;

        bDeleteImage = Boolean(bDeleteImage);

        // Validate that the school exists
        const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
        if (!mySchool) {
            return next(new MyError(404, ErrorMessages.Schools.notFound[sLang]));
        }

        var sImageKey = '';

        // Delete current image
        await StorageServices.DeleteFromImageKey(mySchool.sImageKey);

        // If we want to add or replace an image:
        if (bDeleteImage == false) {
            const arrFiles = req.files;
            if (!arrFiles) return next(new MyError(400, ErrorMessages.UploadImages.FileNotFound[sLang]));

            const Upload: any = arrFiles.oImage;

            // Replace current image or add.
            if (Array.isArray(Upload)) {
                return next(new MyError(400, ErrorMessages.UploadImages.moreThanAllowedImages[sLang]));
            }
            else {
                sImageKey = await StorageServices.UploadManyImages(Upload.data, 'schoolImages');
            }
        }

        // Update School with Image
        const updatedSchool = await SchoolQueries.updateSchoolImage(sSchoolId, sImageKey);

        return res.status(201).json({
            message: SuccessMessages.Schools.uploadSchoolLogo[sLang],
            school: updatedSchool,
            success: true
        });
    }


    // Get school analytics
     async getSchoolsAnalytics(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;

        // GET school analytics
        const iActiveSchools = await SchoolQueries.findCountOfActiveSchools();

        return res.status(201).json({
            message: SuccessMessages.Schools.getAnalytics[sLang],
            countActiveSchools: iActiveSchools,
            success: true
        })
    }

}

export default new Controllers();
