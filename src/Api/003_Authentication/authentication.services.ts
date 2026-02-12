import Bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cryptojs from 'crypto-js';

// Services
import Services from '../../Services/Index.services';

// Error
import MyError  from '../../Middlewares/Error.mw';
import ErrorMessages from "../../Utils/ErrorMessages.util";


interface IPayload {
    sUserId: string;
    sSessionId: string;
};

export interface IHashData {
    sUserId: string;
    sSessionId: string;
}

class Methods {
    constructor() { }

    // Used
    static async comparePassword(sPassword: string, sHash: string): Promise<boolean> {
        return await Bcrypt.compare(sPassword, sHash);
    }

    // Used: GET Token Expiry.
    static async  getExpireToken(tDate: Date, iMinutes: number): Promise<Date> {
        return new Date(tDate.getTime() + (iMinutes * 60000))
    }

    // Used
    // Create Token 
    static async createToken(payload: IPayload): Promise<string> {
        const { sUserId, sSessionId } = payload;
        const NewPayload: IPayload = {
            sUserId: sUserId,
            sSessionId: sSessionId
        };
        // Handle async
        return new Promise((resolve, reject) => {
            jwt.sign(
                { 
                    hash: Services.EncryptObject(NewPayload)
                },
                process.env.JWT_SECRET!,
                { algorithm: 'HS256' },
                (err, token) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(token!);
                    }
                }
            );
        });
    }

    // Used: Decrypt token.
    static async DecryptToken(string: string): Promise<IHashData> {
        const text = cryptojs.AES.decrypt(string, process.env.AES_SECRET).toString(cryptojs.enc.Utf8);
        const parse = JSON.parse(text);
        return parse;
    };

    // Used. Hash password.
    static async HashPassword(sPassword: string, sLang: string): Promise<string> {
        try {
            const salt = await Bcrypt.genSalt(10);
            const Password = await Bcrypt.hash(sPassword, salt);
            return Password;
        } 
        catch (error) {
            throw new MyError(400, ErrorMessages.Authentication.recovery.tokenNotFound[sLang]);
        }
    }


}

export default Methods;