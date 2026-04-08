import { Response, Request, NextFunction } from 'express';
import MyError from '../../../Middlewares/Error.mw';
import TrackingRecordQueries from './trackingRecords.queries';
import GoalQueries from '../goals.queries';
import StudentQueries from '../../023_Students/students.queries';
import StudentAssignmentQueries from '../../028_StudentAssignments/studentAssignments.queries';
import SuccessMessages from '../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../Utils/ErrorMessages.util';
import StorageServices from '../../../Services/Storage.services';
import Services from '../../../Services/Index.services';
import { TrackingRecordFilesModel } from './trackingRecordFiles.model';
import { FilesModel } from '../../009_Files/files.model';

class Controllers {
    constructor() {};

    // Create a tracking record
    async createTrackingRecord(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const oBody = req.body;

        // Verify goal exists and is active
        const myGoal = await GoalQueries.verifyGoalExists(oBody.sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify goal is active (not completed)
        if (myGoal.sStatus !== 'ACTIVE') {
            return next(new MyError(400, ErrorMessages.TrackingRecords.goalNotActive[sLang]));
        }

        // Verify goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // FACULTY can only create records for assigned students
        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        // Insert tracking record
        const { oRecord, dUpdatedProgress } = await TrackingRecordQueries.insertTrackingRecord({
            ...oBody,
            sCreatedBy: sUserId
        });

        return res.status(201).json({
            message: SuccessMessages.TrackingRecords.createRecord[sLang],
            oData: oRecord,
            dUpdatedProgress,
            success: true
        });
    }

    // Get tracking records for a goal
    async getTrackingRecordsByGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sGoalId} = req.params;
        const {iPageNumber = 1, iItemsPerPage = 50, tStartDate, tEndDate} = req.query;

        // Verify goal exists
        const myGoal = await GoalQueries.verifyGoalExists(sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        // Verify goal's student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        const myRecords = await TrackingRecordQueries.findRecordsByGoal(sGoalId, iPageNumber, iItemsPerPage, tStartDate, tEndDate);
        const formattedRecords = await TrackingRecordQueries.formatRecordsForFrontend(myRecords.results);

        return res.status(200).json({
            message: SuccessMessages.TrackingRecords.getAllRecords[sLang],
            aData: formattedRecords,
            iTotalItems: myRecords.total,
            success: true
        });
    }

    // Toggle record exclusion from average
    async toggleExclusion(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sTrackingRecordId} = req.params;
        const {bExcludedFromAverage} = req.body;

        // Verify record exists
        const myRecord = await TrackingRecordQueries.verifyRecordExists(sTrackingRecordId);
        if (!myRecord) {
            return next(new MyError(404, ErrorMessages.TrackingRecords.notFound[sLang]));
        }

        // Verify goal's student belongs to school
        const myGoal = await GoalQueries.verifyGoalExists(myRecord.sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        const { dUpdatedProgress } = await TrackingRecordQueries.toggleExclusion(sTrackingRecordId, bExcludedFromAverage);

        return res.status(200).json({
            message: SuccessMessages.TrackingRecords.toggleExclusion[sLang],
            dUpdatedProgress,
            success: true
        });
    }

    // Delete a tracking record
    async deleteTrackingRecord(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const {sTrackingRecordId} = req.params;

        // Verify record exists
        const myRecord = await TrackingRecordQueries.verifyRecordExists(sTrackingRecordId);
        if (!myRecord) {
            return next(new MyError(404, ErrorMessages.TrackingRecords.notFound[sLang]));
        }

        // Verify goal's student belongs to school
        const myGoal = await GoalQueries.verifyGoalExists(myRecord.sGoalId);
        if (!myGoal) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, myGoal.sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        if (res.locals.sType === 'FACULTY') {
            const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
            if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
        }

        const { dUpdatedProgress } = await TrackingRecordQueries.deleteRecord(sTrackingRecordId);

        return res.status(200).json({
            message: SuccessMessages.TrackingRecords.deleteRecord[sLang],
            dUpdatedProgress,
            success: true
        });
    }

    // POST /trackingRecords/:sTrackingRecordId/files — Upload record files
    async uploadRecordFiles(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId, sSchoolId} = res.locals;
        const {sTrackingRecordId} = req.params;
        var {sArrFileNames} = req.body;

        const arrFiles = req.files;
        if (!arrFiles) return next(new MyError(400, ErrorMessages.UploadImages.FileNotFound[sLang]));
        var Upload: any = arrFiles.oFile;

        // Verify record exists
        const myRecord = await TrackingRecordQueries.verifyRecordExists(sTrackingRecordId);
        if (!myRecord) {
            return next(new MyError(404, ErrorMessages.TrackingRecords.notFound[sLang]));
        }

        if (res.locals.sType === 'FACULTY') {
            const myGoal = await GoalQueries.verifyGoalExists(myRecord.sGoalId);
            if (myGoal) {
                const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
                if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
            }
        }

        // Normalize to arrays
        if (!Array.isArray(Upload)) Upload = [Upload];
        if (!Array.isArray(sArrFileNames)) sArrFileNames = [sArrFileNames];

        let aFiles: any[] = [];
        for (let i = 0; i < Upload.length; i++) {
            const file = Upload[i];
            const uploadResult = await StorageServices.UploadFile(sLang, file, `${sSchoolId}/recordFiles/${sTrackingRecordId}/`, sArrFileNames[i]);
            const sFolio = await Services.RandomFolio('DOC');

            // Insert into Files table
            const newFile = await FilesModel.query().insert({
                sFileKey: uploadResult.sFileKey,
                sFileName: sArrFileNames[i],
                sFileType: uploadResult.sFileType,
                sFolio,
                sCreatedBy: sUserId,
                sLastUpdatedBy: sUserId,
                bActive: true
            }).returning('*');

            // Insert into TrackingRecordFiles junction
            await TrackingRecordFilesModel.query().insert({
                sTrackingRecordFileId: newFile.sFileId,
                sTrackingRecordId
            });

            aFiles.push({
                sFileId: newFile.sFileId,
                sFileName: newFile.sFileName,
                sFileType: newFile.sFileType,
                File: { sKey: await StorageServices.getFile(newFile.sFileKey) }
            });
        }

        return res.status(201).json({
            message: SuccessMessages.TrackingRecords.uploadFiles[sLang],
            aFiles,
            success: true
        });
    }

    // GET /trackingRecords/:sTrackingRecordId/files — List record files
    async getRecordFiles(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        const {sTrackingRecordId} = req.params;

        if (res.locals.sType === 'FACULTY') {
            const myRecord = await TrackingRecordQueries.verifyRecordExists(sTrackingRecordId);
            if (myRecord) {
                const myGoal = await GoalQueries.verifyGoalExists(myRecord.sGoalId);
                if (myGoal) {
                    const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
                    if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
                }
            }
        }

        const files = await TrackingRecordFilesModel.query()
            .where('sTrackingRecordId', sTrackingRecordId)
            .withGraphFetched('File')
            .modifyGraph('File', builder => {
                builder.where('bActive', true);
            });

        return res.status(200).json({
            message: SuccessMessages.TrackingRecords.getAllRecords[sLang],
            aData: files,
            success: true
        });
    }

    // DELETE /trackingRecords/:sTrackingRecordId/files/:sFileId — Delete record file
    async deleteRecordFile(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId} = res.locals;
        const {sTrackingRecordId, sFileId} = req.params;

        if (res.locals.sType === 'FACULTY') {
            const myRecord = await TrackingRecordQueries.verifyRecordExists(sTrackingRecordId);
            if (myRecord) {
                const myGoal = await GoalQueries.verifyGoalExists(myRecord.sGoalId);
                if (myGoal) {
                    const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(myGoal.sStudentId, sUserId);
                    if (!bAllowed) return next(new MyError(403, ErrorMessages.Authentication.accessDenied[sLang]));
                }
            }
        }

        // Verify file belongs to record
        const recordFile = await TrackingRecordFilesModel.query()
            .where('sTrackingRecordFileId', sFileId)
            .where('sTrackingRecordId', sTrackingRecordId)
            .first();

        if (!recordFile) {
            return next(new MyError(404, ErrorMessages.GoalFiles.notFound[sLang]));
        }

        // Get file to delete from S3
        const file = await FilesModel.query().findById(sFileId).where('bActive', true);
        if (file) {
            StorageServices.DeleteFile(file.sFileKey);
            await FilesModel.query().patchAndFetchById(sFileId, { bActive: false });
        }

        return res.status(200).json({
            message: SuccessMessages.GoalFiles.deleteGoalFile[sLang],
            success: true
        });
    }
}

export default new Controllers();
