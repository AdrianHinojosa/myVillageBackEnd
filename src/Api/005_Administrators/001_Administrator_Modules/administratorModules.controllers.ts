import { Response, Request, NextFunction } from 'express';
import ModulesQueries from './administratorModules.queries';
import MyError  from '../../../Middlewares/Error.mw';
import SuccessMessages from '../../../Utils/SuccessMessage.util';

class Controllers {
    constructor() {};
    
    async getModules(req: Request, res: Response, next: NextFunction): Promise<Response | any> {
        const {sLang} = res.locals
        const arrModules = await ModulesQueries.findAllModules();
        return res.status(201).json({
            message: SuccessMessages.AdministratorModules.getAllAdministratorModules[sLang],
            modules: arrModules,
        })
    }

}

export default new Controllers();