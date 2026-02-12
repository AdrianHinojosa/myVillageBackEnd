import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import CitiesControllers from './cities.controllers';
import * as CitiesValidations from './cities.validations';

const router = Router({mergeParams: true});

// Get ALL Cities from a specific country or state
router.get('/', celebrate({ query: CitiesValidations.GetCitiesByStateOrCountryQuery }),  aH(CitiesControllers.getCitiesByStateOrCountry));


export default router;