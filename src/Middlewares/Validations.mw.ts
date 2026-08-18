import { Joi } from "celebrate";
import moment from 'moment-timezone';


// =======================================
// ============ GENERIC VALIDATORS =======
// =======================================

export const Filters = {
    sSearch: Joi.string().lowercase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").allow("").allow(null).error(new Error("Filters sSearch")),
    iPageNumber: Joi.number().min(1).allow().error(new Error("Filters iPageNumber")),
    iItemsPerPage: Joi.number().allow("").allow(null).min(1).error(new Error("Filters iItemsPerPage")),
};


export const FiltersNoPagination = {
    sSearch: Joi.string().lowercase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").allow("").allow(null).error(new Error("Filters sSearch")),
};

export const LanguageParams: object = {
    sLang: Joi.string().required().error(new Error("sLang Translations"))
}

export function JoiObjectKeys(oKeys: any) {
    return Joi.object().keys(oKeys)
}

export function StringActionType(error: string): typeof Joi {
    return Joi.string().valid('READ', 'WRITE', 'ADMIN').required().error(new Error(error));
}
// Gender
export function StringGender(error: string): typeof Joi {
    return Joi.string().valid('Hombre', 'Mujer', 'Otro').error(new Error(error));
}

// Evaluation integer
export function PositiveEvaluationInteger(error: string): typeof Joi {
    return Joi.number().integer().min(0).max(5).allow(null).error(new Error(error));
}

export function RequiredArrayNumber(error: string): typeof Joi {
    return Joi.array().required().items(Joi.number()).error(new Error(error))
}

export function ArrayNumber(error: string): typeof Joi {
    return Joi.array().items(Joi.number()).error(new Error(error))
}

export function RequiredArrayString(error: string): typeof Joi {
    return Joi.array().required().items(Joi.string()).error(new Error(error))
}

export function ArrayString(error: string): typeof Joi {
    return Joi.array().items(Joi.string()).error(new Error(error))
}

export function RequiredBoolean(error: string): typeof Joi {
    return Joi.boolean().required().error(new Error(error));
}

export function Boolean(error: string): typeof Joi {
    return Joi.boolean().allow(null).error(new Error(error));
}

export function RequiredArray(error: string): typeof Joi {
    return Joi.array().required().error(new Error(error))
}

export function Array(error: string): typeof Joi {
    return Joi.array().error(new Error(error))
}

export function RequiredArrayItems(error: string, items: object): typeof Joi {
    return Joi.array().required().items(items).error(new Error(error)).min(1)
}

export function ArrayItems(error: string, items: object): typeof Joi {
    return Joi.array().items(items).error(new Error(error)).min(1)
}

export function UUID(error: string) {
    return Joi.string().guid().trim().allow('').allow(null).error(new Error(error));
}

export function UUIDArray(error: string): typeof Joi {
    return Joi.array().items(Joi.string().guid()).error(new Error(error))
}

export function UUIDArrayAllowNull(error: string): typeof Joi {
    return Joi.array().items(Joi.string().guid()).allow(null).allow('').error(new Error(error))
}

export function RequiredUUID(error: string): typeof Joi {
    return Joi.string().guid().trim().required().error(new Error(error));
}

export function RequiredUUIDArray(error: string): typeof Joi {
    return Joi.array().required().items(Joi.string().guid()).error(new Error(error)).min(1)
}

export function RequiredString(error: string): typeof Joi {
    return Joi.string().trim().required().error(new Error(error));
}

export function RequiredStringLength(error: string, length?: number): typeof Joi {
    return Joi.string().trim().required().max(length).error(new Error(error));
}

export function RequiredLowString(error: string): typeof Joi {
    return Joi.string().trim().required().lowercase().error(new Error(error));
}

export function RequiredNumber(error: string): typeof Joi {
    return Joi.number().max(1000000000000000).required().error(new Error(error));
}

export function RequiredPositiveNumber(error: string): typeof Joi {
    return Joi.number().max(1000000000000000).required().positive().error(new Error(error));
}

export function RequiredNumberAllowZero(error: string): typeof Joi {
    return Joi.number().max(1000000000000000).required().error(new Error(error));
}

export function RequiredNumberAllowNegative(error: string): typeof Joi {
    return Joi.number().max(1000000000000000).required().error(new Error(error));
}

export function PositiveMonetaryValue(error: string): typeof Joi {
    return Joi.number().positive().allow(0).max(10000000000000000000).precision(8).error(new Error(error));
}

export function RequiredPositiveMonetaryValue(error: string): typeof Joi {
    return Joi.number().positive().allow(0).max(1000000000000000000).required().precision(8).error(new Error(error));
}

export function PositivePercentValue(error: string): typeof Joi {
    return Joi.number().positive().allow(0).max(100).precision(8).error(new Error(error));
}

export function RequiredPositiveOrNegativeMonetaryValue(error: string): typeof Joi {
    return Joi.number().allow(0).min(-1000000000000000).max(1000000000000000).required().precision(2).error(new Error(error));
}

// Add max
export function Number(error: string): typeof Joi {
    return Joi.number().max(1000000000000000).error(new Error(error));
}

// Add Max
export function PositiveNumber(error: string): typeof Joi {
    return Joi.number().allow(null).min(0).max(1000000000000000).error(new Error(error));
}

export function RequiredPositiveInteger(error: string): typeof Joi {
    return Joi.number().integer().min(0).max(1000000).required().error(new Error(error));
}

export function PositiveInteger(error: string): typeof Joi {
    return Joi.number().allow(null).integer().min(0).error(new Error(error));
}

export function String(error: string): typeof Joi {
    return Joi.string().trim().allow("").allow(null).error(new Error(error));
}

export function StringNotEmpty(error: string): typeof Joi {
    return Joi.string().trim().error(new Error(error));
}

export function StringExactLength(error: string, length: number): typeof Joi {
    return Joi.string().trim().allow("").length(length).allow(null).error(new Error(error));
}

export function StringNumbersExactLength(error: string, length: number): typeof Joi {
    return Joi.string().allow("").pattern(new RegExp(`^\\d{${length}}$`)).error(new Error(error));
}

export function StringSort(error: string): typeof Joi {
    return Joi.string().trim().allow('asc', 'desc').allow("").allow(null).error(new Error(error));
}

export function CorrectPassword(error: string): typeof Joi {
    return Joi.string().required().trim().regex(/(^[a-zA-Z0-9])*(^[a-zA-Z0-9?_$`~;:!#%*+=@&.^()!]+$)/).min(6).error(new Error(error));
}

/**
 * Email validation. Joi's own `.email()` does the work — deliberately WITHOUT a hand-rolled regex.
 *
 * There used to be `.regex(/^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3}){1,2})$/)` on top of `.email()`, and
 * it only ever NARROWED a correct validator, wrongly. It allowed 1–2 dot-segments after the first
 * domain label, each of exactly 2–3 characters, so it rejected:
 *
 *   catalina.bermea@correo.himalayamonterrey.com   subdomain longer than 3 chars
 *   a@mail.google.com                             same reason
 *   a@domain.info / .online / .school / .tech      TLD longer than 3 chars
 *   a@b.c.d.com                                   more than 2 segments
 *
 * That blocked the address in `POST /schoolUsers`, `POST /schools` **and `POST /auth/login`**, so an
 * affected user could not be created and could not have signed in even if the row were inserted by
 * hand. Reported from production use, 2026-08-18.
 *
 * `minDomainSegments: 2` still requires a real domain (`a@b` is refused). `tlds: { allow: false }`
 * skips checking the TLD against a fixed list, so new and country TLDs are not rejected for being
 * unfamiliar — the shape is what matters here, and deliverability is proven by the confirmation mail.
 *
 * `max(254)` is the RFC 5321 limit. The previous `max(70)` was arbitrary and tighter than the column
 * itself (`Users.sEmail` and `Schools.sEmail` are both `varchar(255)`), so it rejected long but
 * perfectly valid corporate addresses.
 *
 * `convert: true` with `.trim()` and `.lowercase()` keeps normalising input, so " A@Domain.COM "
 * still stores as "a@domain.com" — that behaviour is unchanged and several lookups depend on it.
 */
export function RequiredCorrectEmail(error: string): typeof Joi {
    return Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: false } }).lowercase().options({
        convert: true
    }).max(254).required().error(new Error(error));
}

export function CorrectEmail(error: string): typeof Joi {
    return Joi.string().trim().allow("").allow(null).email({ minDomainSegments: 2, tlds: { allow: false } }).lowercase().options({
        convert: true
    }).max(254).error(new Error(error));
}

export function CorrectPhoneNumber(error: string): typeof Joi {
    return Joi.string()
        .trim()
        .allow("").allow(null)
        .min(8)
        .max(10)
        .regex(/^([0-9])+$/)
        .error(new Error(error));
}

export function RequiredCorrectPhoneNumber(error: string): typeof Joi {
    return Joi.string()
        .trim()
        .min(8)
        .max(12)
        .regex(/^([0-9])+$/)
        .required()
        .error(new Error(error));
}


export function RequiredNumberRange(error: string, min: number, max: number): typeof Joi {
    return Joi.number()
        .min(min)
        .max(max)
        .required()
        .error(new Error(error));
}

export function RequiredStringRange(error: string, min: number, max: number): typeof Joi {
    return Joi.string()
        .trim()
        .min(min)
        .max(max)
        .required()
        .error(new Error(error));
}

export function StringRange(error: string, min: number, max: number): typeof Joi {
    return Joi.string()
        .trim()
        .allow("").allow(null)
        .min(min)
        .max(max)
        .error(new Error(error));
}

export function RequiredStringNumberRange(error: string, min: number, max: number): typeof Joi {
    return Joi.string()
        .trim()
        .min(min)
        .max(max)
        .regex(/^([0-9])+$/)
        .required()
        .error(new Error(error));
}

export function StringNumberRange(error: string, min: number, max: number): typeof Joi {
    return Joi.string()
        .trim()
        .allow("").allow(null)
        .min(min)
        .max(max)
        .regex(/^([0-9])+$/)
        .error(new Error(error));
}

export function StringNumberRangeNotEmpty(error: string, min: number, max: number): typeof Joi {
    return Joi.string()
        .trim()
        .allow(null)
        .min(min)
        .max(max)
        .regex(/^([0-9])+$/)
        .error(new Error(error));
}

export function StringNumber(error: string): typeof Joi {
    return Joi.string()
        .trim()
        .allow("").allow(null)
        .regex(/^([0-9])+$/)
        .error(new Error(error));
}

export function NumberRange(error: string, min: number, max: number): typeof Joi {
    return Joi.number()
        .min(min)
        .max(max)
        .regex(/^([0-9])+$/)
        .required()
        .error(new Error(error));
}

export function RequiredDate(error: string): typeof Joi {
    return Joi.date()
        .iso()
        .required()
        .error(new Error(error))
}

export function Date(error: string): typeof Joi {
    return Joi.date()
        .iso().allow(null).allow('')
        .error(new Error(error))
}

export function CorrectStartDate(error: string): typeof Joi {
    return Joi.date()
        .iso()
        .allow("").allow(null)
        .error(new Error(error));
}

export function CorrectEndDate(error: string): typeof Joi {
    return Joi.date()
        .iso()
        .greater(Joi.ref("tStart"))
        .allow("").allow(null)
        .error(new Error(error));
}

export function CorrectUTCDate(errorMessage: string) {
    return Joi.string().custom((value, helpers) => {
      if (!moment(value, moment.ISO_8601, true).isValid()) {
        return helpers.error('date.base', { message: errorMessage });
      }

      let utcDate = null;

      if (errorMessage.includes("tEndDate") || errorMessage.includes("tUpperEndDate")) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').endOf('day').utc().format();
      }

      if (errorMessage.includes("tStartDate")  || errorMessage.includes("tLowerEndDate")  ) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').startOf('day').utc().format();
      }

      if (!utcDate) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').utc().format();
      }

      return utcDate;
    }, 'Date in UTC Custom Validation').error(new Error(errorMessage));
}


export function CorrectUTCDateRequired(errorMessage: string) {
    return Joi.string().required().custom((value, helpers) => {
      if (!moment(value, moment.ISO_8601, true).isValid()) {
        return helpers.error('date.base', { message: errorMessage });
      }

      let utcDate = null;

      if (errorMessage.includes("tEndDate") || errorMessage.includes("tUpperEndDate")) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').endOf('day').utc().format();
      }

      if (errorMessage.includes("tStartDate")  || errorMessage.includes("tLowerEndDate")  ) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').startOf('day').utc().format();
      }

      if (!utcDate) {
        utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').utc().format();
      }

      return utcDate;
    }, 'Date in UTC Custom Validation').error(new Error(errorMessage));
}



export function CorrectUTCDateBody(errorMessage: string) {
    return Joi.string().custom((value, helpers) => {
      if (!moment(value, moment.ISO_8601, true).isValid()) {
        return helpers.error('date.base', { message: errorMessage });
      }

      const utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').utc().format();

      return utcDate;
    }, 'Date in UTC Custom Validation').error(new Error(errorMessage));
}



export function CorrectUTCDateNotRequired(errorMessage: string) {
    return Joi.string().allow('', null).custom((value, helpers) => {

        if (value === '' || value === null) {
            return null;
        }

        if (!moment(value, moment.ISO_8601, true).isValid()) {
            return helpers.error('date.base', { message: errorMessage });
        }

        const utcDate = moment.tz(value, 'YYYY-MM-DD', 'Etc/GMT+6').utc().format();

        return utcDate;
    }, 'Date in UTC Custom Validation').error(new Error(errorMessage));
}


export function CorrectUTCDateOnly(errorMessage: string) {
    return Joi.string().custom((value, helpers) => {
      if (!moment(value, moment.ISO_8601, true).isValid()) {
        return helpers.error('date.base', { message: errorMessage });
      }

      return moment(value, 'YYYY-MM-DD').format('YYYY-MM-DD');

    }, 'Date Only Custom Validation').error(new Error(errorMessage));
}

export function CorrectUTCDateOnlyNotRequired(errorMessage: string) {
    return Joi.string().allow('', null).custom((value, helpers) => {
        if (value === '' || value === null) {
            return null;
        }

        if (!moment(value, moment.ISO_8601, true).isValid()) {
            return helpers.error('date.base', { message: errorMessage });
        }

        return moment(value, 'YYYY-MM-DD').format('YYYY-MM-DD');

    }, 'Date Only Custom Validation').error(new Error(errorMessage));
}
