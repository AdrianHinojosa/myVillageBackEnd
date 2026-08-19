import { Response, Request, NextFunction } from 'express';

// Error
import MyError from '../../Middlewares/Error.mw';

// Queries
import UserQueries from '../004_Users/users.queries';
import SchoolQueries from '../022_Schools/schools.queries';

// Services
import MailEvent from '../../Services/Mail.service';
import SMSService from '../../Services/SMS.services';

// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';

// Support inbox defined in the scope document (Punto 10).
const SUPPORT_EMAIL_FALLBACK = 'info@myvillage.com.mx';

// Category slugs come from the frontend; the support inbox reads Spanish labels.
const CATEGORY_LABELS: { [key: string]: string } = {
    technical: 'Técnico',
    question: 'Pregunta',
    suggestion: 'Sugerencia',
    other: 'Otro'
};

// Human label for the reporter, so support knows who is writing without looking anything up.
function getReporterRole(sTypeUser: string, sType: string): string {
    if (sTypeUser === 'Administrator') return 'Superadministrador';
    if (sType === 'FACULTY') return 'Docente';
    return 'Administrador de colegio';
}

class Controllers {
    constructor() {
    };

    // Send a support ticket by email (no persistence — out of scope for this stage)
    async sendTicket(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang, sUserId, sSchoolId, sTypeUser, sType} = res.locals;
        const {sSubject, sMessage, sCategory} = req.body;

        // Reporter identity always comes from the token, never from the body.
        const myUser = await UserQueries.getUserContactById(sUserId);
        if (!myUser) {
            return next(new MyError(404, ErrorMessages.Support.reporterNotFound[sLang]));
        }

        // School context is optional: a SuperAdmin has no school.
        let sSchoolName = '';
        if (sSchoolId) {
            const mySchool = await SchoolQueries.verifySchoolExists(sSchoolId);
            sSchoolName = mySchool?.sName || '';
        }

        const sReporterName = `${myUser.sName || ''} ${myUser.sLastName || ''}`.trim();
        const sCategoryLabel = CATEGORY_LABELS[sCategory] || 'Sin categoría';

        MailEvent.emit('SendEmail', {
            aEmails: [process.env.SUPPORT_EMAIL || SUPPORT_EMAIL_FALLBACK],
            oData: {
                sSubject,
                sMessage,
                sCategory: sCategoryLabel,
                sReporterName,
                sReporterEmail: myUser.sEmail || '',
                sReporterPhone: myUser.sPhoneNumber || '',
                sReporterRole: getReporterRole(sTypeUser, sType),
                sSchoolName: sSchoolName || 'Sin colegio asociado',
                sSchoolId: sSchoolId || '',
                sUserId,
                sLang
            },
            sType: 'supportTicket',
            sSubject: `[Soporte] ${sSubject}`
        });

        // Optional SMS heads-up. Disabled unless BOTH env vars are set, so no message is sent
        // until support explicitly opts in with a destination number.
        if (process.env.SUPPORT_SMS_ENABLED === 'true' && process.env.SUPPORT_PHONE) {
            SMSService.emit(
                'sendSMS',
                process.env.SUPPORT_PHONE,
                `My Village — nuevo ticket de soporte (${sCategoryLabel}) de ${sReporterName}: ${sSubject}`
            );
        }

        return res.status(200).json({
            message: SuccessMessages.Support.sendTicket[sLang],
            success: true
        });
    }
}

export default new Controllers();
