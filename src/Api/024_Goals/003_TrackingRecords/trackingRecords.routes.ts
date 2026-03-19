import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import TrackingRecordController from './trackingRecords.controllers';
import * as TrackingRecordValidations from './trackingRecords.validations';
import { verifySchoolUserPermissions } from '../../../Middlewares/001_Permissions.mw.ts/schools.permissions';
import upload from 'express-fileupload';

const router = Router();

// POST /trackingRecords — Create a tracking record
router.post('/',
    celebrate({ body: TrackingRecordValidations.CreateTrackingRecordBody }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'WRITE' }])),
    aH(TrackingRecordController.createTrackingRecord)
);

// PATCH /trackingRecords/:sTrackingRecordId/toggleExclusion — Toggle exclusion from average
router.patch('/:sTrackingRecordId/toggleExclusion',
    celebrate({
        params: TrackingRecordValidations.ToggleExclusionParams,
        body: TrackingRecordValidations.ToggleExclusionBody
    }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'WRITE' }])),
    aH(TrackingRecordController.toggleExclusion)
);

// DELETE /trackingRecords/:sTrackingRecordId — Delete a tracking record
router.delete('/:sTrackingRecordId',
    celebrate({ params: TrackingRecordValidations.DeleteTrackingRecordParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'WRITE' }])),
    aH(TrackingRecordController.deleteTrackingRecord)
);

// POST /trackingRecords/:sTrackingRecordId/files — Upload record files
router.post('/:sTrackingRecordId/files',
    aH(upload()),
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'WRITE' }])),
    aH(TrackingRecordController.uploadRecordFiles)
);

// GET /trackingRecords/:sTrackingRecordId/files — List record files
router.get('/:sTrackingRecordId/files',
    celebrate({ params: TrackingRecordValidations.GetTrackingRecordParams }),
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'READ' }])),
    aH(TrackingRecordController.getRecordFiles)
);

// DELETE /trackingRecords/:sTrackingRecordId/files/:sFileId — Delete record file
router.delete('/:sTrackingRecordId/files/:sFileId',
    aH(verifySchoolUserPermissions([{ sModuleName: 'Goals', sActionCode: 'WRITE' }])),
    aH(TrackingRecordController.deleteRecordFile)
);

export default router;
