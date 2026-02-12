import { Response, Request, NextFunction } from 'express';
import CountriesQueries from './countries.queries';
import SuccessMessages from '../../Utils/SuccessMessage.util';
import { count } from 'console';

class Controllers {
    constructor() {};

    public async getCountries(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals;
        const {iPageNumber, iItemsPerPage, sSearch} = req.query;
        const myCountries = await CountriesQueries.findAllCountries(iPageNumber, iItemsPerPage, sSearch);
        const iNumPages = Math.ceil( myCountries.total / Number(iItemsPerPage) );

        return res.status(200).json({
            message: SuccessMessages.Countries.getCountries[sLang],
            countries: myCountries.results,
            iTotal: myCountries.total,
            iNumPages: iNumPages
        })
    }
}

export default new Controllers();