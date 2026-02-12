require('dotenv').config()
import Events from 'events';
import AWS, { SNS } from 'aws-sdk';
const SMSService = new Events.EventEmitter() as any;
var SNSAPI = new SNS({});

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


// Contact form.
SMSService.on('sendSMS', async function (sPhone, sMessage) {
    return new Promise((resolve, reject) => {
        SNSAPI.checkIfPhoneNumberIsOptedOut({phoneNumber: sPhone}).promise()
        .then(data => {
          if(data.isOptedOut){
            console.log('failed');
            return resolve({sent: false, message:"El telefono ha elegido no recibir mensajes SMS."})
          }
          let publishParams = {
            Message: sMessage,
            PhoneNumber: sPhone
          };
          return SNSAPI.publish(publishParams).promise()
        })
        .then(data => {
          console.log('SMS sent')
          console.log(sPhone)
          resolve({data, sent: true, message: "El mensaje SMS se envíó correctamente"}) 
        })
        .catch(err => {
          console.log(err)
          return;

        })
    });
})

export default SMSService;