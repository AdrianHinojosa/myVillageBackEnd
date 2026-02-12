import { Response, Request, NextFunction } from 'express';
// Error
import MyError from '../../../Middlewares/Error.mw';
// Queries 
import StatesQueries from './states.queries';
import CountriesQueries from '../countries.queries';
// Messages
import SuccessMessages from '../../../Utils/SuccessMessage.util';
import ErrorMessages from '../../../Utils/ErrorMessages.util';


class Controllers {
    constructor() {};

    public async getStatesFromCountry(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {sCountryId} = req.params;
        const {iPageNumber, iItemsPerPage, sSearch} = req.query;

        // Validate Country exists
        const myCountry = await CountriesQueries.verifyCountryExists(sCountryId);
        if (!myCountry) {
            return next(new MyError(404, ErrorMessages.Countries.notFound[sLang]))
        }

        // Find states from that country
        const myStates = await StatesQueries.findAllStatesByCountry(iPageNumber, iItemsPerPage, sSearch, sCountryId);
        const iNumPages = Math.ceil( myStates.total / Number(iItemsPerPage) );

        return res.status(200).json({
            message: SuccessMessages.States.getStates[sLang],
            states: myStates,
            iTotal: myStates.total,
            iNumPages: iNumPages
        })
    }
}

export default new Controllers();