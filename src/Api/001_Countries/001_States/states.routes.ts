import { Router } from "express";
import aH from "express-async-handler";
import { celebrate } from "celebrate";
import StateControllers from './states.controllers';
import * as StateValidations from './states.validations';

const router = Router({mergeParams: true});

// Get ALL States from a specific country
router.get('/',  celebrate({ params: StateValidations.GetStatesByCountryParams , query: StateValidations.GetStates }), aH(StateControllers.getStatesFromCountry));


export default router;
