
import { Joi } from 'celebrate';
import * as Validations from '../../Middlewares/Validations.mw';

export const GetCountries = Validations.JoiObjectKeys({
    ...Validations.Filters
});

export const Filters = Validations.Filters;