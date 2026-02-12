
import { Joi } from 'celebrate';
import * as Validations from '../../../Middlewares/Validations.mw';

export const GetStates = Validations.JoiObjectKeys({
    ...Validations.Filters
});

export const GetStatesByCountryParams = Validations.JoiObjectKeys({
    sCountryId: Validations.RequiredUUID("Locations sCountryId"),
});


export const Filters = Validations.Filters;