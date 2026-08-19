import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const SendTicketBody = Validations.JoiObjectKeys({
    sSubject: Validations.RequiredStringLength("Support sSubject", 120),
    sMessage: Validations.RequiredStringLength("Support sMessage", 1000),
    sCategory: Joi.string().valid('technical', 'question', 'suggestion', 'other')
        .allow('').allow(null).error(new Error("Support sCategory")),
});
