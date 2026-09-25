import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import PublicController from './public.controllers';
import * as PublicValidations from './public.validations';
import { signupRateLimit } from './public.rateLimit';

const router = Router();

// Punto 18 — alta pública You/You+. SIN auth (como login/recovery). Rate-limit + correo único.
router.post('/signup',
    signupRateLimit(),
    celebrate({ body: PublicValidations.SignupBody }),
    aH(PublicController.signup));

// Fase 2 — captación de colegios (solo envía correo, no crea cuenta). Mismo rate-limit anti-flood.
router.post('/schoolLead',
    signupRateLimit(),
    celebrate({ body: PublicValidations.SchoolLeadBody }),
    aH(PublicController.schoolLead));

export default router;
