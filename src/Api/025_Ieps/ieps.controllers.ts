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

        return res.status(200).json({
            message: SuccessMessages.IEPs.getIep[sLang],
            oData: iep || null,
            success: true
        });
    }
}

export default new Controllers();
