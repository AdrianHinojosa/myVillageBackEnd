import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../../Middlewares/Error.mw';

// Queries
import GoalFilesQueries from './goalFiles.queries';
import GoalQueries from '../goals.queries';

// Messages
import SuccessMessages from '../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../Utils/ErrorMessages.util';

// Services
import mailer from '../../../Services/Mail.service';
import Services from '../../../Services/Index.services';
import Storage from '../../../Services/Storage.services';

// Validations
import {celebrate} from 'celebrate';
import * as GoalFileValidations from './goalFiles.validations';
import StorageServices from '../../../Services/Storage.services';

class Controllers {
    constructor() {
    };

    // Create goal file
    async createGoalFile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId, sSchoolId} = res.locals;
        const {sGoalId} = req.params;
        var {sArrGoalFileNames} = req.body;
        // Note: Already validated that the school exists and is active.
        // Check files exist
        const arrFiles = req.files;
        if (!arrFiles) return next(new MyError(400, ErrorMessages.UploadImages.FileNotFound[sLang]));
        var Upload : any = arrFiles.oFile;

        // Normalize single file upload to an array
        if (!Array.isArray(Upload)) {
            Upload = [Upload];
        }
        if (!Array.isArray(sArrGoalFileNames)) {
            sArrGoalFileNames = [sArrGoalFileNames];
        }

        // Validate that the same amount of files and names are given.
        if (Upload.length !== sArrGoalFileNames.length) {
            return next(new MyError(400, ErrorMessages.UploadImages.fileNamesAndFileAmountsNotMatch[sLang]));
        }

        // Validate that the goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]  )) }

        let arrFilesObject : {
            // GoalFile Data
            sGoalId: string,
            // File Data
            File: {
                sFileKey: string,
                sFileName: string,
                sFileType: string,
                sFolio: string,
                sCreatedBy: string,
                sLastUpdatedBy: string
            }
        }[] = [];

        // If array, upload multiple files
        if (Array.isArray(Upload)) {
            for (let iCount = 0; iCount < Upload.length; iCount++) {
                const file = Upload[iCount];
                const uploadResult =  await Storage.UploadFile(sLang, file, `${sSchoolId}/goalFiles/${sGoalId}/`, sArrGoalFileNames[iCount]);
                const sFolio = await Services.RandomFolio('DOC')

                arrFilesObject.push({
                    sGoalId: sGoalId,
                    File: {
                        sFileKey: uploadResult.sFileKey, // The S3 key of the file
                        sFileName: sArrGoalFileNames[iCount],
                        sFileType: uploadResult.sFileType, // The determined file type
                        sFolio: sFolio,
                        sCreatedBy: sUserId,
                        sLastUpdatedBy: sUserId
                    }
                });
                //  Later proceed to insert each file into the database
            }
        }
        // If not array, upload one file
        else {
            const uploadResult = await Storage.UploadFile(sLang, Upload, `${sSchoolId}/goalFiles/${sGoalId}/`, sArrGoalFileNames[0]);
            const sFolio = await Services.RandomFolio('DOC')
            arrFilesObject.push({
                sGoalId: sGoalId,
                File: {
                    sFileKey: uploadResult.sFileKey,
                    sFileName: sArrGoalFileNames[0], // Assuming single file name is the first element
                    sFileType: uploadResult.sFileType,
                    sFolio: sFolio,
                    sCreatedBy: sUserId,
                    sLastUpdatedBy: sUserId
                }
            });
        }

        // UPLOAD to database.
        const newFiles = await GoalFilesQueries.insertGoalFiles(arrFilesObject)

        return res.status(201).json({
            message: SuccessMessages.GoalFiles.createGoalFile[sLang],
            goalFile: true, // return Goal files,
            newFiles: newFiles,
            arrFilesObject: arrFilesObject
        });
    }

    // GET ALL GoalFiles
    async getGoalFiles(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sGoalId} = req.params;
        let {sSearch} = req.query;

        // Note: Already validated that the school exists and is active.

        // Validate that the Goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]  )) }

        const arrGoalFiles = await GoalFilesQueries.findAllGoalFilesByGoal(sGoalId, sSearch);

        return res.status(201).json({
            message: SuccessMessages.GoalFiles.getAllGoalFiles[sLang],
            goalFiles: arrGoalFiles,
            iTotal: arrGoalFiles.length,
            success: true
        })
    }

    // Get ONE GoalFile.
    async getOneGoalFile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sGoalFileId, sGoalId} = req.params;

        // Note: Already validated that the school exists and is active.

        // Validate that the goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]  )) }

        // GET One GoalFile of a Goal. Already validated that Goal Exists.
        const myGoalFile = await GoalFilesQueries.findOneGoalFileByGoal(sGoalFileId, sGoalId);
        if (!myGoalFile) {return next(new MyError(404, ErrorMessages.GoalFiles.notFound[sLang]  )) }

        return res.status(201).json({
            message: SuccessMessages.GoalFiles.getOneGoalFile[sLang],
            goalFile: myGoalFile,
            success: true
        })
    }


    // Delete GoalFile.
    async deleteGoalFile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sGoalFileId, sGoalId} = req.params;

        // Note: Already validated that the school exists and is active.

        // Validate that the goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]  )) }

        // GET One GoalFile of a Goal. Already validated that Goal Exists.
        const myGoalFile = await GoalFilesQueries.findOneGoalFileByGoal(sGoalFileId, sGoalId);
        if (!myGoalFile) {return next(new MyError(404, ErrorMessages.GoalFiles.notFound[sLang]  )) }

        // Delete GoalFile
        const deletedGoalFile = await GoalFilesQueries.deleteGoalFile(sGoalFileId);
        await StorageServices.DeleteFile(myGoalFile.File.sFileKey);

        return res.status(201).json({
            message: SuccessMessages.GoalFiles.deleteGoalFile[sLang],
            success: true
        })
    }

}

export default new Controllers();
