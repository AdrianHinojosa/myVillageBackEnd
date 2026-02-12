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
        console.log("this is a validation error.");
        switch (err.type) {
            case "ModelValidation":
                next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
                break;
            case "RelationExpression":
                next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
                break;
            case "UnallowedRelation":
                next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
                break;
            case "InvalidGraph":
                next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
                break;
            default:
                next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
                break;
        }
    } else if (err instanceof NotFoundError) {
        return next(new MyError(404, "Verifique que los campos ingresados sean correctos."));
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
        return next(
            new MyError(400, "Es necesario llenar todos los datos requeridos")
        );
    } else if (err instanceof ForeignKeyViolationError) {
        return next(new MyError(409, "Verifique que los campos ingresados sean correctos."));
    } else if (err instanceof CheckViolationError) {
        return next(new MyError(400, "Verifique que los campos ingresados sean correctos."));
    } else if (err instanceof DataError) {
        console.log(err);
        console.log("DATA ERROR");
        return next(
            new MyError(400, "Verifique que los campos ingresados sean correctos.")
        );
    } else if (err instanceof DBError) {
        return next(new MyError(500, "Verifique que los campos ingresados sean correctos."));
    } else if (err instanceof URIError) {
        return next(
            new MyError(400, 'Bad request.')
        )
    } 
    else if (err instanceof DBError) {
        // Check if it's a check constraint violation for sActionCode
        return next(new MyError(409, 'Verifique que los campos ingresados sean correctos.'));
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