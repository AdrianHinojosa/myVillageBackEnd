import { Response, Request, NextFunction } from 'express';
import MyError from '../../Middlewares/Error.mw';
import IepQueries from './ieps.queries';
import StudentQueries from '../023_Students/students.queries';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

class Controllers {
    constructor() {};

    // POST /iep — Create or Update IEP (upsert)
    async upsertIep(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId, sUserId} = res.locals;
        const { sStudentId, ...oIepData } = req.body;

        // Verify student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        try {
            const iep = await IepQueries.upsertIep(sStudentId, oIepData, sUserId);

            return res.status(201).json({
                message: SuccessMessages.IEPs.upsertIep[sLang],
                oData: {
                    sIepId: iep.sIepId,
                    sStudentId: iep.sStudentId,
                    sStatus: iep.sStatus,
                    dtUpdatedAt: iep.updated_at
                },
                success: true
            });
        } catch (err) {
            console.error('IEP upsert error:', err.message || err);
            console.error('IEP upsert nativeError:', err.nativeError?.message || 'none');
            console.error('IEP upsert data keys:', Object.keys(oIepData));
            return next(err);
        }
    }

    // GET /iep?sStudentId=xxx — Get Student's IEP
    async getIep(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sSchoolId} = res.locals;
        const {sStudentId} = req.query;

        // Verify student belongs to school
        const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, String(sStudentId));
        if (!myStudent) {
            return next(new MyError(404, ErrorMessages.Students.notFound[sLang]));
        }

        const iep = await IepQueries.findIepByStudent(String(sStudentId));

        // Map DB column names to frontend field names so frontend can strip them before POST
        let oData = null;
        if (iep) {
            const { created_at, updated_at, bActive, tDeletedAt, sCreatedBy, sLastUpdatedBy, ...oIepFields } = iep as any;
            oData = {
                ...oIepFields,
                dtCreatedAt: created_at,
                dtUpdatedAt: updated_at,
            };
        }

        return res.status(200).json({
            message: SuccessMessages.IEPs.getIep[sLang],
            oData,
            success: true
        });
    }
}

export default new Controllers();
