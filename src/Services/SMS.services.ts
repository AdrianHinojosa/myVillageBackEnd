require('dotenv').config()
import Events from 'events';
import AWS, { SNS } from 'aws-sdk';
const SMSService = new Events.EventEmitter() as any;

// NOTE: aws-sdk v2 clients capture their configuration at construction time, so the credentials
// MUST be passed to the constructor. This file previously did `new SNS({})` and then called
// AWS.config.update() afterwards, which left the client with no region and no credentials — every
// publish would have failed. It went unnoticed because nothing imported this service until P10.
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

var SNSAPI = new SNS({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


/**
 * Send an SMS through AWS SNS.
 *
 * Fire-and-forget, like the mail service: callers use `SMSService.emit('sendSMS', sPhone, sMessage)`
 * and never await a result, so this must NEVER throw or leave a promise unsettled.
 *
 * `sPhone` must be E.164 (e.g. +528181377416).
 */
SMSService.on('sendSMS', async function (sPhone: string, sMessage: string): Promise<any> {
    try {
        const oOptOut = await SNSAPI.checkIfPhoneNumberIsOptedOut({ phoneNumber: sPhone }).promise();
        if (oOptOut.isOptedOut) {
            console.log(`SMS not sent — ${sPhone} has opted out of SMS messages.`);
            return { sent: false, message: "El telefono ha elegido no recibir mensajes SMS." };
        }

        const oResult = await SNSAPI.publish({
            Message: sMessage,
            PhoneNumber: sPhone
        }).promise();

        console.log(`SMS sent to ${sPhone} (MessageId ${oResult.MessageId})`);
        return { data: oResult, sent: true, message: "El mensaje SMS se envíó correctamente" };
    } catch (error: any) {
        // Swallow: the caller cannot react to this, and an SMS failure must never break the request.
        console.error(`Error sending SMS to ${sPhone}:`, error?.message || error);
        return { sent: false, message: error?.message || 'SMS send failed' };
    }
})

export default SMSService;