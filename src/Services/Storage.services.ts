import AWS, { S3 } from 'aws-sdk';
import Sharp from 'sharp';
import Crypto from 'crypto';
import ErrorMessages from '../Utils/ErrorMessages.util'
import { resolve } from 'path';

// Error
import MyError  from '../Middlewares/Error.mw';

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export interface IListImages {
    sType: string;
    sUrl: string;
}
export interface oImages {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xlg?: string;
}

interface IBaseParams {
    Bucket: string;
    Key: string;
}

export interface IImage {
    sImageKey: string;
}

interface IUploadParams extends IBaseParams {
    Body: any;
    ContentType: string;
}

interface IGetParams extends IBaseParams {
    Expires: number;
    // ResponseContentDisposition: any;
}

interface IUploadFile {
    sFileKey: string,
    sFileType: string
}

const s3: S3 = new AWS.S3({});

class StorageMethods {

    // USED: Upload one images in one dimension.
    private async UploadImage(sKey: string, aData: any, oSize: { sType: string, iWidth: number }): Promise<AWS.S3.ManagedUpload.SendData> {
        return new Promise((resolve, reject) => {
            Sharp(aData).resize({width: oSize.iWidth}).withMetadata().toFormat('jpg').toBuffer().then(data => {
                const Params: AWS.S3.PutObjectRequest = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `${sKey}-${oSize.sType}.jpg`,
                    Body: data,
                    ContentType: 'image/jpeg'
                };
                s3.upload(Params, (err: Error, Data: AWS.S3.ManagedUpload.SendData) => {
                    resolve(Data)
                })
            })
            .catch(() => {
                reject(new MyError(400, "El formato del archivo no es permitido. Vuelva a intentarlo."));
            })
            // .catch(e =>  {throw new MyError(400, "El formato del archivo no es permitido. Vuelva a intentarlo.")});
        })
    }


    // USED: Upload many images in different dimensions.
    public async UploadManyImages(aData, sPath): Promise<string> {
        const Sizes: { sType: string, iWidth: number }[] = [
            { sType: 'xs', iWidth: 90 },
            { sType: 'sm', iWidth: 150 },
            { sType: 'md', iWidth: 300 },
            { sType: 'lg', iWidth: 612 },
            { sType: 'xlg', iWidth: 1080 },
        ];

        return new Promise(async (resolve, reject) => {
            try {
                const Key = `${sPath}/${Crypto.pseudoRandomBytes(16).toString('hex')}`;
                await Promise.all(Sizes.map(async i => {
                    await this.UploadImage(Key, aData, i);
                }));
                resolve(Key);
            } catch (error) {
                reject(new MyError(400, "El formato del archivo no es permitido. Vuelva a intentarlo."));
            }
        });

        /*
            return new Promise(async (resolve, reject) => {
                const Key = `${sPath}/${Crypto.pseudoRandomBytes(16).toString('hex')}`;
                await Promise.all(Sizes.map(async i => {
                    await this.UploadImage(Key, aData, i);
                }));
                resolve(Key);
            });
        */

    }

    // USED: Step 1) Get MANY images.
    public async GetManyImages(sPath: string, aSizes: string[]): Promise<oImages> {
        let build = {};
        for (let i of await this.GetImagesSizes(sPath, aSizes)) {
            build[i.sType] = i.sUrl;
        }
        return sPath != null ? build : null;
    }

      // USED: Step 2) Prepare an array of objects which  to return
      public async GetImagesSizes(sPath: string, aSizes: string[]): Promise<IListImages[]> {
        if (sPath) {
            const Images: IListImages[] = await Promise.all(aSizes.map(async e => {
                return {
                    sType: e,
                    sUrl: await this.GetImages(`${sPath}-${e}.jpg`),
                    // sKey: `${sImageKey}-${e}`
                }
            }))
            return Images;
        } else {
            return [];
        }
    }

    // USED: Step 3) Get from S3 one object
    public async GetImages(sImageKey: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (sImageKey) {
                s3.getSignedUrl('getObject', { Bucket: process.env.AWS_BUCKET_NAME, Key: sImageKey, Expires: 604800 }, (err: Error, url: string) => {
                    if (err) return reject(new MyError(422, err.message));
                    return resolve(url);
                })
            } else {
                return resolve('0');
            }
        })
    }

    // Used: From one image Key DELETE all sizes.
    public async DeleteFromImageKey(sPath: string) {
        let aSizes = ['xs', 'sm', 'md', 'lg', 'xlg']
        return await Promise.all(aSizes.map(async e => {
            s3.deleteObject({Bucket: process.env.AWS_BUCKET_NAME, Key: `${sPath}-${e}.jpg`}, (err: Error, res: any) => {
                if (err) return err;
                else return true;
            })
        }))
    }


    // Used: Delete Image from AWS S3
    public DeleteImageOrFile(sImageKey: string): void {
        const Params: IBaseParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: sImageKey
        };
        s3.deleteObject(Params, (err: Error, res: any) => {
            if (err) return err;
            else return true;
        })
    }


    // ============ Employee Files ============
    
    public UploadFile (sLang, fileData, sPath, sFileName) : Promise<any> {
        const fileType : string = this.CheckFormat({ sType: fileData.mimetype, sFormat: fileData.name });
        const Key: string = `${sPath}/${Crypto.pseudoRandomBytes(16).toString('hex')}.${fileType}`;
        const encodedFileName = encodeURIComponent(`${sFileName}.${fileType}`);
        const Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key,
            Body: fileData.data,
            ContentType: fileData.mimetype ? fileData.mimetype : 'application/pdf', //fileData.name != null ? fileData.name : fileData.mimetype  // Assuming fileData contains mimetype
            ContentDisposition: `inline; filename="${encodedFileName}"` // This sets the filename for download
        };
        return s3.upload(Params).promise()
            .then(resp => {
                return {
                    sFileKey: Key,      // The S3 key of the file
                    sFileType: fileType // The determined file type
                }
            })
            .catch(err => {
                console.log(err)
                throw new MyError(400, ErrorMessages.UploadImages.invalidFile[sLang] );
            });
    };

    public CheckFormat({ sType, sFormat }: { sType?: string; sFormat: string }): string {
        let Response: string = null;
        if (sType === 'application/pdf') return 'pdf';
        if (sType === 'image/jpeg') return 'jpeg';
        if (sType === 'image/jpg') return 'jpg';
        if (sType === 'image/png') return 'png';
        if (sType === 'text/xml') return 'xml';
        if (sType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
        if (sType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
        if (sType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
        if (sType === 'application/octet-stream') return this.getFileEnding({ sFormat });
        if (sType === 'application/msword') return 'doc';
        if (sType === 'text/plain') return 'txt';
        if (sType === 'application/rtf') return 'rtf';
        if (sType === 'application/zip') return 'zip';
        if (sType === 'application/x-7z-compressed') return '7z';
        // CAD Files
        if (sType === 'application/acad') return 'dwg'; // AutoCAD
        if (sType === 'application/x-autocad') return 'dxf'; // AutoCAD
        if (sType === 'application/dxf') return 'dxf'; // AutoCAD
        // Revit Files - There's no official MIME type, but these are common practices.
        if (sType === 'application/octet-stream' && sFormat.toLowerCase().endsWith('.rvt')) return 'rvt'; // Revit
        // Other architecture files
        if (sType === 'application/skp') return 'skp'; // SketchUp
        return Response;
    }

    public getFileEnding({sFormat}: { sFormat: string}): string {
        let sFileFormat: string = null;
        let aFileName: string[] = sFormat.split('.');
        let iLastFileNamePart = aFileName.length - 1;
        sFileFormat = aFileName[iLastFileNamePart];
        return sFileFormat;
    }


    // Used. Get file.
    public getFile(sImageKey): Promise<string> {
        return new Promise((resolve, reject) => {
            if (sImageKey) {
                const Params: IGetParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: sImageKey,
                    Expires: 604800,
                    // ResponseContentDisposition: `inline`
                }
                s3.getSignedUrl('getObject', Params, (err: Error, url: string) => {
                    if (err) return reject(new MyError(422, err.message));
                    return resolve(url)
                })
            } else {
                return resolve(null);
            }
        })
    }

    // Used: Delete File
    public DeleteFile(sImageKey): void {
        const Params: IBaseParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: sImageKey
        };
        s3.deleteObject(Params, (err: Error, res: any) => {
            if (err) {
                return false; 
            } 
            else {
                console.log('successfully deleted S3 file.')
                return true;
            }
        })
    }

    


    // ==================== OTHER FUNCTIONS NOT USED   ======================================== 


    public async ValidateImages({oFiles,sType,sFormat,sLang}: { oFiles: any, sType: 'image' | 'document', sFormat: string, sLang: string }): Promise<any> {
        const Files = oFiles;
        if (!Files) return Promise.reject(new MyError(404, ErrorMessages.UploadImages.FileNotFound[sLang]));
        const Upload: any = sType == 'image' ? Files.oImage : Files.oFile;
        if (!Upload) return Promise.reject(new MyError(409, ErrorMessages.UploadImages.FileNameNotFound[sLang]));
        let Format: string = null;
        switch (sType) {
            case 'image':
                Format = this.CheckImagesFormat({
                    sType: Upload.mimetype,
                    sFormat: sFormat as string
                });
                break;
            case 'document':
                Format = this.CheckImagesFormat({
                    sType: Upload.mimetype,
                    sFormat: sFormat as string
                });
                break;
        }
        if (!Format) return Promise.reject(new MyError(412, ErrorMessages.UploadImages.invalidFile[sLang]));
        return Upload
    }


    public CheckImagesFormat({ sType, sFormat }: { sType?: string; sFormat: string }): string {
        let Response: string = null;
        if (sType === 'image/jpeg') return 'jpeg';
        if (sType === 'image/png') return 'png';
        if (sType === 'application/octet-stream') return this.CheckImagesFormat({ sFormat });
        if (sType === 'image/tiff') return 'tiff';
        return Response;
    }
   
};

export default new StorageMethods();