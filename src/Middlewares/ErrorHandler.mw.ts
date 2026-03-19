import Messages from "../Utils/ValidationError.util";
import ErrorMessages from "../Utils/ErrorMessages.util";
import { Request, Response, NextFunction } from "express";
import MyError from "./Error.mw";
import {
    ValidationError,
    NotFoundError,
    DBError,
    UniqueViolationError,
    NotNullViolationError,
    ForeignKeyViolationError,
    CheckViolationError,
    DataError,
} from "objection";
import { IMyError } from "./SendAsJson.mw";
import Services from '../Services/Index.services'

interface IErrHandler extends IMyError {
    type: string
}

export default () => async (err: IErrHandler, req: Request, res: Response, next: NextFunction) => {
    let { sLang } = res.locals
    console.log(err)
    if (err.hasOwnProperty("joi")) {
        err.type = "JoiValidationError";
    }
    console.log(
        "———————————————————————————————————————————————————————————————————————————"
    );
    if (err.name === "CustomError") {
        console.log(err);
        let { sPassword } = req.body;
        let body = { ...req.body };

        if (sPassword) body.sPassword = "*********";
        console.log({
            body: body,
            params: req.params,
            query: req.query,
        });
        return next(err);
    }
    if (err instanceof ValidationError) {
        console.log("Objection ValidationError:", err.type, JSON.stringify(err.data));
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "Please verify that the entered fields are correct."
            : "Verifique que los campos ingresados sean correctos.";
        return next(new MyError(400, sMsg));
    } else if (err instanceof NotFoundError) {
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "The requested resource was not found."
            : "El recurso solicitado no fue encontrado.";
        return next(new MyError(404, sMsg));
    } else if (err instanceof UniqueViolationError) {
        if (err.columns.includes("sEmail")) {
            return next(
                new MyError(409, "Ese correo ya existe, favor de ingresar otro correo!")
            );
        }
        else {
            return next(new MyError(409,  "Verifique que los campos ingresados sean correctos."));
        }
    } else if (err instanceof NotNullViolationError) {
        console.log("NotNullViolationError:", err.column);
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "Please fill in all required fields."
            : "Es necesario llenar todos los datos requeridos.";
        return next(new MyError(400, sMsg));
    } else if (err instanceof ForeignKeyViolationError) {
        console.log("ForeignKeyViolationError:", err.constraint);
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "Please verify that the entered fields are correct."
            : "Verifique que los campos ingresados sean correctos.";
        return next(new MyError(409, sMsg));
    } else if (err instanceof CheckViolationError) {
        console.log("CheckViolationError:", err.constraint);
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "Please verify that the entered fields are correct."
            : "Verifique que los campos ingresados sean correctos.";
        return next(new MyError(400, sMsg));
    } else if (err instanceof DataError) {
        console.log("DataError:", err.message);
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "Please verify that the entered fields are correct."
            : "Verifique que los campos ingresados sean correctos.";
        return next(new MyError(400, sMsg));
    } else if (err instanceof DBError) {
        console.log("DBError:", err.message);
        const sErrLang = sLang || 'sp';
        const sMsg = sErrLang === 'en'
            ? "A database error occurred."
            : "Ocurrió un error de base de datos.";
        return next(new MyError(500, sMsg));
    } else if (err instanceof URIError) {
        return next(new MyError(400, 'Bad request.'));
    }
    
    else if (err.name === "JsonWebTokenError") {
        const {
            authorization
        } = req.headers;
        console.log(authorization);
        let sMyLang =  `${sLang ? sLang : 'sp'}`;
        return next(
            new MyError(401, ErrorMessages.Authentication.invalidToken[sMyLang])
        );
    } else if (err.type === "JoiValidationError") {
        console.log("JOIVALIDATIONERROR");
        console.log(err.message);
        console.log('logging code')
        console.log(err.code)
        
        if (err.message.includes("allowed")) {
            return next(new MyError(409, err.message));
        } else {
            const [langCode, type, message] = [
                `${sLang ? sLang : 'sp'}`,
                err.message.split(" ")[0],
                err.message.split(" ")[1],
            ];
            console.log( Messages[err.type][type])

            return next(
                new MyError(409, Messages[err.type][type][message][langCode])
            );
        }
    } else {
        console.log(err);
        return next(new MyError(500, err.message));
    }
}