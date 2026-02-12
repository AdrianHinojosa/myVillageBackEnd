/*
 — Each file must contain a short description with the next instructions:
    1) File's corresponding model / module.
    2) File's use with the objective or short description.
*/
/******************@Flags_Definition ******************/
/**@GreenFlag -> No es necesario para continuar pero si para cumplir el requerimiento (Representa una funcionalidad incompleta). */
/**@YellowFlag -> No impide el funcionamiento a corto plazo (No es del todo necesario en la fase de desarrollo). */
/**@RedFlag -> Impide por completo el funcionamiento. */

require("dotenv").config({ path: ".env" });
/**Requierements */
import express, { Express, Request, Response, NextFunction } from "express";
import Services from './Services/Index.services';
import cors from "cors";
import logger from "morgan";
import path from "path";
import moment from 'moment';
import Routes from './Api/000_Index/Index.routes';
moment.locale('es');
let customMonths = 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_');
moment.updateLocale('es', { months: customMonths });
import 'moment-timezone';
moment.tz.setDefault('America/Monterrey');

const app: Express = express();

/**Logger */
logger.token('localDate', function getDate(req) {
    let date = new Date();
    return Services.GetDate(date).toLocaleString('en-US', { timeZone: 'America/Monterrey' })
});
logger.format('combined', ':method - :status [:localDate] :url :res[content-length] :response-time');

/**Security Requirements */
import helmet from "helmet";

/**Middleware requirements */
let Environment = Services.GetEnvironment(process.env.NODE_ENV);

import ErrHandler from "./Middlewares/ErrorHandler.mw";
import SendAsJson, { Logs } from "./Middlewares/SendAsJson.mw";

if (process.env.NODE_ENV != "development" && !process.env.NODE_ENV.includes('local')) {
    app.use(function (req: Request, res: Response, next: NextFunction) {
        res.setTimeout(10000, function () {
            return res.status(408).json({
                message: "Request timeout.",
                status: false
            })
        });
        return next();
    });
}

/**Variable definitions */
const Port: number | string = process.env.NODE_PORT || 3000;
const ProjectName: string = process.env.PROJECT_NAME;

/**Middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(logger('combined'));

app.use((req: Request, res: Response, next: NextFunction): void => {
    let { sPassword } = req.body;
    let body = { ...req.body };
    if (sPassword) body.sPassword = "*********";
    console.log({
        body: body,
        params: req.params,
        query: req.query
    });
    next()
});

app.use(cors());

/*
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});
*/

/**Start Route */
app.get(``, (req: Request, res: Response, next: NextFunction): object => {
    console.log(Environment)
    return res.status(200).json({
        Message: `${ProjectName} API is up and running on port ${Port}`,
    });
});

Routes(app, Environment);

/**Error Handlers */
app.use(ErrHandler());
app.use(SendAsJson());

export default app;