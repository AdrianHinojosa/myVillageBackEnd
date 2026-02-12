import crypto from 'crypto';
import cryptojs from 'crypto-js';
import Bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { NextFunction } from 'express';
import MyError from '../Middlewares/Error.mw';
import ErrorMessages from '../Utils/ErrorMessages.util';
import { Page } from 'objection';
import { randomUUID } from 'crypto';

export interface IEnvironment {
    Environment: 'development' | 'testing' | 'preproduction' | 'production' | 'local' | 'local_prod' | 'local_dev' | 'local_qa' | 'local_alfa';
}

export interface ISortFilter {
    sSort: 'asc' | 'desc';
}

export interface IPayload {
    sUserId: string;
    sSessionId: string;
};

export interface IFilters {
    iPageNumber?: number;
    iItemsPerPage?: number;
    sSearch?: string;
    tStart?: string;
    tEnd?: string;
}

export interface IHashData {
    sUserId: string;
    sSessionId: string;
    tExpiration?: Date;
    sUserType: 'customer' | 'administrator'
}

export interface ICustomPage<X> {
    total: number;
    results: X[]
}

class Methods {
    constructor() { }

    // Used app.ts
    GetEnvironment(Variable: string): string {
        let Environment: string = null;
        switch (Variable) {
            case 'development':
                Environment = '/development';
                break;
            case 'beta':
                Environment = '/beta';
                break;
            case 'alfa':
                Environment = '/alfa';
                break;
            case 'production':
                Environment = '';
                break;
            case 'local':
            case 'local_prod':
            case 'local_dev':
            case 'local_qa':
            case 'local_alfa':
                Environment = '';
                break;
            default:
                Environment = '/development';
                break;
        }
        return Environment
    }
    
    // Used. For recovery passwords.
    CreateRandomToken(iBytes: number): string {
        return crypto.randomBytes(iBytes).toString('hex');
    }

    // Used
    EncryptObject(object: object): string {
        let stringify = JSON.stringify(object);
        return cryptojs.AES.encrypt(stringify, process.env.AES_SECRET).toString();
    };


    // Used: Decrypt token.
    DecryptToken(string: string, sLang: string = 'en'): IHashData {
        try {
            const text = cryptojs.AES.decrypt(string, process.env.AES_SECRET).toString(cryptojs.enc.Utf8);

            if (!text || text.trim() === '') {
                throw new MyError(401, ErrorMessages.Authentication.corruptedToken[sLang]);
            }

            const parse = JSON.parse(text);
            return parse;
        } catch (error) {
            if (error instanceof MyError) {
                throw error;
            }
            throw new MyError(401, ErrorMessages.Authentication.corruptedToken[sLang]);
        }
    };


    // Used
    ExpireToken(tDate: Date, iMinutes: number): Date {
        return new Date(tDate.getTime() + (iMinutes * 60000))
    }



    GetDiff(timeZone: string): number {
        const timeZoneName = Intl.DateTimeFormat("ia", {
            timeZoneName: "short",
            timeZone,
        })
            .formatToParts()
            .find((i) => i.type === "timeZoneName").value;
        const offset = timeZoneName.slice(3);
        if (!offset) return 0;

        const matchData = offset.match(/([+-])(\d+)(?::(\d+))?/);
        if (!matchData) throw `cannot parse timezone name: ${timeZoneName}`;

        const [, sign, hour, minute] = matchData;
        let result = parseInt(hour) * 60;
        if (sign === "-") result *= -1;
        if (minute) result + parseInt(minute);

        return result;
    }

    GetDate(tDate: Date): Date {
        const offset: number = this.GetDiff('America/Monterrey');

        const localDateInMilliseconds: number = tDate.setHours(tDate.getHours() + (offset / 60));

        return new Date(localDateInMilliseconds);
    }

    FindDuplicates(arry: string[]): string[] {
        return arry.filter((item, index) => arry.indexOf(item) !== index)
    }

    FindIndexDuplicates(array: string[]): number[] {
        return array.map((item, index) => {
            if (array.indexOf(item) !== index) {
                return index
            }
        })
    }

    // Used: Generate random folio
    RandomFolio(sType:  'ENT' | 'DOC' ): string {
        const Prefix = {
            ENT: 'ENT',
            DOC: 'DOC',
        };

        let pincode: string[] = [];
        let loopTimes: number = 8;

        for (let i = 0; i < loopTimes; i++) {
            let numeric: string = crypto.randomBytes(1).toString('hex');
            let array: string[] = numeric.split('');
            let logs: string = array[Math.floor(Math.random() * array.length)]
            pincode.push(logs);
        }
        return Prefix[sType] + '-' + pincode.join('').toUpperCase();
    }

    // Generate a Folio with a given sType
    generateFolio(sType: string, iCount: number): string {
        // Convert to uppercase to ensure consistency
        const prefix = sType.toUpperCase();
        
        const sequentialNumber = (10000 + iCount + 1).toString();
        return `${prefix}-${sequentialNumber}`;
    }



    DecryptObject(string: string): IHashData {
        const text = cryptojs.AES.decrypt(string, process.env.AES_SECRET).toString(cryptojs.enc.Utf8);
        const parse = JSON.parse(text);
        return parse;
    };

    ValidJSONString(string: string): boolean {
        try {
            JSON.parse(string);
        } catch (e) {
            return false;
        }
        return true;
    }

  

    CreateJWTToken(payload: any): string {
        return jwt.sign({
            hash: this.EncryptObject(payload)
        }, process.env.JWT_SECRET, {
            algorithm: 'HS256'
        });
    }

    CreateToken(payload: IPayload): string {
        const { sUserId, sSessionId } = payload;
        const NewPayload: IPayload = {
            sUserId: sUserId,
            sSessionId: sSessionId
        }
        return jwt.sign({
            hash: this.EncryptObject(NewPayload)
        }, process.env.JWT_SECRET, {
            algorithm: 'HS256'
        })
    };

    encryptObject(object: object): string {
        let stringify = JSON.stringify(object);
        return cryptojs.AES.encrypt(stringify, process.env.AES_SECRET).toString();
    };

    GetTime(tDate: Date): number {
        const offset = tDate.getTimezoneOffset();

        const localDateInMilliseconds = tDate.setHours(tDate.getHours() - (offset / 60));

        tDate = new Date(localDateInMilliseconds);

        return tDate.getTime();
    }

    AddDays(date: Date, days: number): Date {
        date = new Date(date);
        date.setDate(date.getDate() + days);
        return date;
    }


    RandomNumbers(iLength: number): string {
        const numbers: number[] = [1, 2, 3, 5, 6, 7, 8, 9, 0];
        let result: string[] = [];
        for (let i = 0; i < iLength; i++) {
            result.push(numbers[Math.floor(Math.random() * 10)].toString());
        }
        return result.join('');
    }

    PairEncrypt(data: string, key: crypto.RsaPublicKey): Buffer {
        return crypto.publicEncrypt(key, Buffer.from(data));
    }

    PairDecrypt(data: string, key: crypto.RsaPrivateKey): Buffer {
        return crypto.privateDecrypt(key, Buffer.from(data));
    }

    FormatDate(date: Date): string {
        return moment(date).format('DD-MM-YYYY')
    }

    FormatDateWithHours(date: Date): string {
        return moment(date).format('DD-MM-YYYY hh:mma')
    }

    async ValidateLists({ List, iPageNumber, iItemsPerPage, sLang }: {
        List: Page<any>,
        iPageNumber: number,
        iItemsPerPage: number,
        sLang: string
    }): Promise<{
        List: any
        Total: number
        CurrentPage: number
        NumPages: number
    }> {
        if (iPageNumber && (isNaN(Number(iPageNumber)) || Number(iPageNumber) <= 0)) return Promise.reject(new MyError(404, ErrorMessages.Pagination.invalidNumber[sLang]));

        const Total = List.total;
        const CurrentPage: number = iPageNumber && iItemsPerPage ? Number(iPageNumber) : 1;
        const NumPages = Total > 1 ? Math.ceil(Number(Total) / Number(iItemsPerPage)) : 1;

        if (Number(iPageNumber) > Number(NumPages)) return Promise.reject(new MyError(400, ErrorMessages.Pagination.maximumNumber[sLang]));

        return {
            List: List.results,
            Total,
            CurrentPage,
            NumPages
        }
    }

    RandomUUID(): string {
        return randomUUID()
    }

    public GetPercentage({
        dCurrentPrice,
        dOriginalPrice
    }: { dOriginalPrice: number, dCurrentPrice: number }): number {
        let TotalPercentage: number = 100;
        return 100 - parseFloat(((dCurrentPrice * TotalPercentage) / dOriginalPrice).toFixed(2))
    }
}

export default new Methods();