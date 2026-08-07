import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../../Middlewares/Error.mw';

// Queries
import SubGoalQueries from './subGoals.queries';
import GoalQueries from '../goals.queries';
import TrackingRecordQueries from '../003_TrackingRecords/trackingRecords.queries';
import StudentQueries from '../../023_Students/students.queries';
import StudentAssignmentQueries from '../../028_StudentAssignments/studentAssignments.queries';

// Messages
import SuccessMessages from '../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../Utils/ErrorMessages.util';

/**
 * Shared access check: the goal's student must belong to the caller's school, and a FACULTY user
 * must additionally be assigned to that student. Mirrors what goals.controllers.ts does on every
 * goal route.
 *
 * Module-level on purpose — controller methods are handed to Express as bare references
 * (`aH(SubGoalController.method)`), so `this` is not bound inside them.
 */
async function verifyAccess(res: Response, sStudentId: string): Promise<string | null> {
    const { sLang, sSchoolId, sUserId } = res.locals;

    const myStudent = await StudentQueries.verifyStudentExistsBySchool(sSchoolId, sStudentId);
    if (!myStudent) return ErrorMessages.Goals.notFound[sLang];

    if (res.locals.sType === 'FACULTY') {
        const bAllowed = await StudentAssignmentQueries.isStudentAssignedToUser(sStudentId, sUserId);
        if (!bAllowed) return ErrorMessages.Authentication.accessDenied[sLang];
    }
    return null;
}

class Controllers {
    constructor() {};

    // GET /goals/:sGoalId/subGoals
    async getSubGoalsByGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        const { sGoalId } = req.params;

        const myGoal = await SubGoalQueries.verifyParentGoalExists(sGoalId);
        if (!myGoal) return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));

        const sAccessError = await verifyAccess(res, myGoal.sStudentId);
        if (sAccessError) return next(new MyError(403, sAccessError));

        const aSubGoals = await SubGoalQueries.findSubGoalsByGoal(sGoalId);

        // `aData` — the frontend reads `data.aData || data.results || data` and then calls .map(),
        // so a named key such as `subGoals` would fall through to the raw object and throw.
        return res.status(200).json({
            message: SuccessMessages.SubGoals.getAllSubGoals[sLang],
            aData: aSubGoals.map((o: any) => SubGoalQueries.formatSubGoalForFrontend(o)),
            iTotal: aSubGoals.length,
            success: true
        });
    }

    // POST /goals/:sGoalId/subGoals
    async createSubGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sUserId } = res.locals;
        const { sGoalId } = req.params;
        const { aTasks, ...oBody } = req.body;

        // Must be a TOP-LEVEL goal: only one level of nesting is allowed by the contract.
        const myGoal = await SubGoalQueries.verifyParentGoalExists(sGoalId);
        if (!myGoal) {
            const bIsSubGoal = await SubGoalQueries.verifySubGoalExists(sGoalId);
            if (bIsSubGoal) return next(new MyError(409, ErrorMessages.SubGoals.nestingNotAllowed[sLang]));
            return next(new MyError(404, ErrorMessages.Goals.notFound[sLang]));
        }

        const sAccessError = await verifyAccess(res, myGoal.sStudentId);
        if (sAccessError) return next(new MyError(403, sAccessError));

        // Hard cap of 5. The frontend disables its button at the limit, but that is cosmetic.
        const iExisting = await SubGoalQueries.countSubGoals(sGoalId);
        if (iExisting >= SubGoalQueries.MAX_SUBGOALS) {
            return next(new MyError(409, ErrorMessages.SubGoals.maxReached[sLang]));
        }

        const newSubGoal = await SubGoalQueries.insertSubGoal(sGoalId, myGoal, oBody, aTasks, sUserId);

        return res.status(201).json({
            message: SuccessMessages.SubGoals.createSubGoal[sLang],
            oData: SubGoalQueries.formatSubGoalForFrontend(newSubGoal),
            success: true
        });
    }

    // PUT /subGoals/:sSubGoalId
    async updateSubGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sUserId } = res.locals;
        const { sSubGoalId } = req.params;
        const { aTasks, ...oBody } = req.body;

        const mySubGoal = await SubGoalQueries.verifySubGoalExists(sSubGoalId);
        if (!mySubGoal) return next(new MyError(404, ErrorMessages.SubGoals.notFound[sLang]));

        const sAccessError = await verifyAccess(res, mySubGoal.sStudentId);
        if (sAccessError) return next(new MyError(403, sAccessError));

        const updatedSubGoal = await SubGoalQueries.updateSubGoal(sSubGoalId, oBody, aTasks, sUserId);

        return res.status(200).json({
            message: SuccessMessages.SubGoals.updateSubGoal[sLang],
            oData: SubGoalQueries.formatSubGoalForFrontend(updatedSubGoal),
            success: true
        });
    }

    // DELETE /subGoals/:sSubGoalId
    async deleteSubGoal(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang, sUserId } = res.locals;
        const { sSubGoalId } = req.params;

        const mySubGoal = await SubGoalQueries.verifySubGoalExists(sSubGoalId);
        if (!mySubGoal) return next(new MyError(404, ErrorMessages.SubGoals.notFound[sLang]));

        const sAccessError = await verifyAccess(res, mySubGoal.sStudentId);
        if (sAccessError) return next(new MyError(403, sAccessError));

        await SubGoalQueries.deleteSubGoal(sSubGoalId, sUserId);

        return res.status(200).json({
            message: SuccessMessages.SubGoals.deleteSubGoal[sLang],
            success: true
        });
    }

    // GET /subGoals/:sSubGoalId/trackingRecords
    async getSubGoalRecords(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        const { sSubGoalId } = req.params;
        let { iItemsPerPage = 20, iPageNumber = 1, tStartDate, tEndDate } = req.query;

        const mySubGoal = await SubGoalQueries.verifySubGoalExists(sSubGoalId);
        if (!mySubGoal) return next(new MyError(404, ErrorMessages.SubGoals.notFound[sLang]));

        const sAccessError = await verifyAccess(res, mySubGoal.sStudentId);
        if (sAccessError) return next(new MyError(403, sAccessError));

        // Records of a subgoal are ordinary TrackingRecords whose sGoalId is the subgoal's id —
        // no separate table, no separate query path.
        const oRecords = await TrackingRecordQueries.findRecordsByGoal(
            sSubGoalId, iPageNumber, iItemsPerPage, tStartDate, tEndDate
        );
        const aFormatted = await TrackingRecordQueries.formatRecordsForFrontend(oRecords.results);

        return res.status(200).json({
            message: SuccessMessages.TrackingRecords.getAllRecords[sLang],
            aData: aFormatted,
            iTotal: oRecords.total,
            iNumPages: Math.ceil(oRecords.total / Number(iItemsPerPage)),
            success: true
        });
    }
}

export default new Controllers();
