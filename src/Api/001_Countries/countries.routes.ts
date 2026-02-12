import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import CountryControllers from './countries.controllers';
import * as CountryValidations from './countries.validations';
import StateRoutes from './001_States/states.routes';

const router = Router();

// Get ALL
router.get('/',  celebrate({ query: CountryValidations.GetCountries }), aH(CountryControllers.getCountries));

// States routes
router.use('/:sCountryId/states',  aH(StateRoutes));

export default router;