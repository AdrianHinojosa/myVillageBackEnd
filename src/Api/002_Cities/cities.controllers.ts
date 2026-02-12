import { Response, Request, NextFunction } from 'express';
// Error
import MyError from '../../Middlewares/Error.mw';
// Queries 
import CitiesQueries from './cities.queries';
import CountriesQueries from '../001_Countries/countries.queries';
import StatesQueries from '../001_Countries/001_States/states.queries';


// Messages
import SuccessMessages from '../../Utils/SuccessMessage.util';
import ErrorMessages from '../../Utils/ErrorMessages.util';


class Controllers {
    constructor() {};

    public async getCitiesByStateOrCountry(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sCountryId, sStateId} = req.query;
        const {iPageNumber, iItemsPerPage, sSearch} = req.query;

        // Validate Country exists
        if (sCountryId) {
            const myCountry = await CountriesQueries.verifyCountryExists(sCountryId);
            if (!myCountry) {
                return next(new MyError(404, ErrorMessages.Countries.notFound[sLang]))
            }
        }
        if (sStateId) {
            const myState = await StatesQueries.verifyStateExists(sStateId);
            if (!myState) {
                return next(new MyError(404, ErrorMessages.States.notFound[sLang]))
            }
        }

        // Find cities from that state or country
        const myCities = await CitiesQueries.findAllCitiesByStateOrCountry(iPageNumber, iItemsPerPage, sSearch, sCountryId, sStateId);
        const iNumPages = Math.ceil( myCities.total / Number(iItemsPerPage) );

        return res.status(200).json({
            message: SuccessMessages.Cities.getCities[sLang],
            cities: myCities,
            iTotal: myCities.total,
            iNumPages: iNumPages
        })
    }
}

export default new Controllers();