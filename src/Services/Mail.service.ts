import Events from 'events';
import Fs from 'fs';
import Path from 'path';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Handlebars from 'handlebars';
import * as FsAux from 'fs/promises';

interface IMailTypes {
    sType: 'newAdmin' | 'forgotPassword' | 'newSchool'
}

interface IMail {
    aEmails: any[],
    oData: any,
    sType: IMailTypes['sType'],
    sSubject: string
}


interface ISendEmail {
    on(
        event: 'SendEmail' ,
        listener: (
            arg: {
                aEmails: IMail['aEmails'],
                oData: IMail['oData'],
                sType: IMail['sType'],
                sSubject: IMail['sSubject']
            }
        ) => Promise<void>
    ): this;
    emit(
        event: 'SendEmail',
        arg: {
            aEmails: IMail['aEmails'],
            oData: IMail['oData'],
            sType: IMail['sType'],
            sSubject: IMail['sSubject']
        }
    ): boolean;
}

const MailEvent = new Events.EventEmitter() as ISendEmail;

const mail = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export default MailEvent;

MailEvent.on('SendEmail', async function ({ aEmails, oData, sType, sSubject }: IMail) {
    const readTemplate = async (templateType: string): Promise<string> => {
        const filePath = Path.join(__dirname, `../Views/${templateType}.html`);
        const content = await FsAux.readFile(filePath, 'utf-8');
        return content as string;
      };
    try {
      const templateContent = await readTemplate(sType);
      const template = Handlebars.compile(templateContent);
      const sAssetsUrl = `${process.env.URL_TYPE}://${process.env.SCHOOLS_PLATFORM}`;
      const data = template({ ...oData, sAssetsUrl });
      console.log('before sending email')
      console.log('data is')
      console.log(oData)
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: aEmails,
        },
        Message: {
          Body: {
            Html: {
              Data: data,
            },
          },
          Subject: {
            Data: `${sSubject}`,
            Charset: 'UTF-8',
          },
        },
        Source: `My Village <${process.env.EMAIL_SOURCE}>`,
      });
  
      await mail.send(command);
      console.log('Email sent');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });