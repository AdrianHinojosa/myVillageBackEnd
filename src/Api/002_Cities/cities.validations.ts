
import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';
import MyError from "../../Middlewares/Error.mw";
import { error } from 'console';

export const GetCities = Validations.JoiObjectKeys({
    ...Validations.Filters
});

export const GetCitiesByStateOrCountryQuery = Validations.JoiObjectKeys({
    sStateId: Validations.UUID("Locations sCountryIdXORsStateId"),
    sCountryId: Validations.UUID("Locations sCountryIdXORsStateId"),
}).xor('sStateId', 'sCountryId').error(errors => {
    // If there are no errors, return undefined to use Joi's default validation behavior.
    return errors.length > 0 ? new Error("Locations sCountryIdXORsStateId") : undefined;
});


export const Filters = Validations.Filters;