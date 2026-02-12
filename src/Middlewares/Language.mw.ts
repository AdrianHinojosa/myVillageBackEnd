import MyError from "./Error.mw";
import { Request, Response, NextFunction } from "express";

export default () => (req: Request, res: Response, next: NextFunction) => {
    const { sLang}: { sLang?: 'sp' | 'en'} = req.params;
    //@FLAG Activar cuando manejo de idiomas esté disponible.
    // const ValidLanguages: string[] = ['sp','en'];
    const ValidLanguages: string[] = ['sp', 'en'];
    if (ValidLanguages.includes(sLang)) {
        res.locals.sLang = sLang;
        return next();
    } 
    else {
        return next(new MyError(404, `The language '${sLang}' is not allowed.`))
    }
}