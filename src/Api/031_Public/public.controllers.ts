import { Response, Request, NextFunction } from 'express';
import SchoolQueries from '../022_Schools/schools.queries';
import UserQueries from '../004_Users/users.queries';
import RecoverySessionQueries from '../003_Authentication/001_RecoverySessions/recoverySession.queries';
import MyError from '../../Middlewares/Error.mw';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';
import Services from '../../Services/Index.services';
import mailer from '../../Services/Mail.service';

/**
 * Punto 18 — registro PÚBLICO (autoservicio) de cuentas You / You+.
 *
 * Reusa exactamente el flujo de alta de `schools.controllers.ts` (insertSchool + token de
 * recuperación 72h + email `newSchool` → set-password), pero SIN auth: cualquiera puede registrarse.
 * Solo You/You+ (SCHOOL se da de alta manualmente por transferencia). Se crea en modo STRIPE porque
 * You/You+ se cobran con tarjeta; la cobranza real arranca al capturar la tarjeta (Fase 1 billing).
 */
class Controllers {
    constructor() { }

    async signup(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        let { sAccountType, sAdminName, sLastName, sSecondLastName, sPhone, sEmail } = req.body;

        // Defensa (Joi ya lo valida, pero el endpoint es público): jamás crear un SCHOOL por autoservicio.
        if (sAccountType !== 'YOU' && sAccountType !== 'YOU_PLUS') {
            return next(new MyError(400, ErrorMessages.Public.invalidModality[sLang]));
        }

        sEmail = sEmail.toLowerCase();
        const userExists = await UserQueries.getUserByEmail(sEmail);
        if (userExists) {
            return next(new MyError(409, ErrorMessages.Authentication.signup.userExist[sLang]));
        }

        // El nombre de la cuenta se deriva del nombre de la persona (no se pide por separado).
        const sName = [sAdminName, sLastName, sSecondLastName].filter(Boolean).join(' ').trim();

        const myObject = await SchoolQueries.insertSchool({
            sName,
            sPhone,
            sEmail,
            sAddress: null,
            sCityId: null,
            iUsersLimit: 0,
            iStudentsLimit: 0,
            sAccountType,
            // You/You+ ignoran sBillingMode (cobran por cuota), pero el default de la columna es FIXED.
            sBillingMode: null,
            dFixedAmount: null,
            dAmountPerTeacher: null,
            dAmountPerStudent: null,
            dDiscountPct: null,
            // Cobro con tarjeta: la cuota arranca cuando el usuario captura su tarjeta.
            sPaymentMethod: 'STRIPE',
            dMonthlyAmount: null,
            tNextPaymentDate: null,
            // Autoservicio: no hay usuario creador.
            sCreatedBy: null,
            sAdminName,
            sLastName,
            sSecondLastName,
        });

        const Token: string = Services.CreateRandomToken(64);
        const ExpiredDate: Date = Services.ExpireToken(new Date(), 4320); // 72 horas
        await RecoverySessionQueries.insertTokenByUserId(Token, myObject.user.sUserId, ExpiredDate);

        let sMyUrl = `https://${process.env.NODE_ENV}.${process.env.SCHOOLS_PLATFORM}/set-password/${Token}`;
        if (process.env.NODE_ENV === 'production') {
            sMyUrl = `https://${process.env.SCHOOLS_PLATFORM}/set-password/${Token}`;
        }

        await mailer.emit('SendEmail', {
            aEmails: [sEmail],
            sSubject: 'Bienvenido a MyVillage',
            oData: {
                sFullName: sAdminName,
                sUrl: sMyUrl
            },
            sType: 'newSchool'
        });

        return res.status(201).json({
            message: SuccessMessages.Public.signup[sLang],
            success: true
        });
    }

    /**
     * Fase 2 — captación de colegios desde el sitio público. NO crea cuenta (los colegios se dan de
     * alta manualmente por transferencia): solo envía un correo al equipo con los datos del lead.
     */
    async schoolLead(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const { sLang } = res.locals;
        const { sInstitution, sContactName, sEmail, sPhone, sCity, sStudentsEstimate, sMessage } = req.body;

        // Bandeja de captación (spec Fase 2). Configurable por env; con fallback a las dos direcciones.
        const aLeadEmails = (process.env.SCHOOL_LEAD_EMAILS
            || 'info@myvillage.com.mx,lucypotes@myvillage.com.mx')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);

        MailEvent.emit('SendEmail', {
            aEmails: aLeadEmails,
            oData: {
                sInstitution,
                sContactName,
                sEmail,
                sPhone,
                sCity: sCity || 'No especificada',
                sStudentsEstimate: sStudentsEstimate || 'No especificado',
                sMessage: sMessage || 'Sin mensaje.'
            },
            sType: 'schoolLead',
            sSubject: `[Prueba Colegio] ${sInstitution}`
        });

        return res.status(200).json({
            message: SuccessMessages.Public.schoolLead[sLang],
            success: true
        });
    }
}

export default new Controllers();
