export default class MyError extends Error {
    statusCode: number;
    constructor(code: number, message: string, callstack?: any) {
        super(message);
        this.name = "CustomError";
        this.statusCode = code;
        if (callstack) this.stack = callstack;
    }
}