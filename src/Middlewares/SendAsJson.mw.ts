import { Request, Response, NextFunction } from "express";

interface ICustomError extends Error {
    statusCode: number;
};

export interface IMyError {
    code: number,
    status?: boolean,
    name?: string,
    message: string
}

export const Logs = () => (req: Request, res: Response, next: NextFunction): void => {
    let { sPassword } = req.body;
    let body = { ...req.body };
    if (sPassword) body.sPassword = "*********";

    console.log({
        body: body,
        params: req.params,
        query: req.query
    });
    return next();
}
export default () => (err: ICustomError, req: Request, res: Response, next: NextFunction): Response<IMyError> => {
    console.log(err)    
    // if (process.env.NODE_ENV === 'production') {
    if (err.statusCode !== 500) {
        return res.status(err.statusCode).json({
            code: err.statusCode,
            status: false,
            name: err.name,
            message: err.message
        })
    } else {
        return res.status(500).json({
            code: 500,
            status: false,
            name: err.name,
            message: 'Server Error'
        });
    }
    // } else {
    //     next(err);
    // }
}