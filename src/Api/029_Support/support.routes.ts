import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import SupportController from './support.controllers';
import * as SupportValidations from './support.validations';
import { verifyAnyAuthenticatedUser } from '../../Middlewares/001_Permissions.mw.ts/shared.permissions';

const router = Router();

// Send a support ticket — reachable by ANY authenticated user (SchoolAdmin, FACULTY, SuperAdmin)
router.post('/ticket',
    aH(verifyAnyAuthenticatedUser()),
    celebrate({ body: SupportValidations.SendTicketBody }),
    aH(SupportController.sendTicket));

export default router;
