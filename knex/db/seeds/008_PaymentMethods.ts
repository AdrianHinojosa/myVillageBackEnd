exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('PaymentMethods').del()
      .then(function () {
        // Inserts seed entries
        return knex('PaymentMethods').insert([
            { sPaymentMethodId: '54d36e8f-deec-46e7-883a-a6e818b429e5', sPaymentMethodName: 'Credit Card', bActive: true },
            { sPaymentMethodId: 'bb8b5054-db2c-4150-ba98-bbe597ebd6ea', sPaymentMethodName: 'Check', bActive: true },
            { sPaymentMethodId: '5cb2aaa6-9809-4c39-a20a-f35fd3c004f4', sPaymentMethodName: 'Bank Transfer', bActive: true },
            { sPaymentMethodId: 'aa3cc2a6-ed78-42e4-bbe6-b873140856eb', sPaymentMethodName: 'Cash', bActive: true },
            { sPaymentMethodId: 'f4bd93da-918b-4a5e-bfab-ba9d88b13251', sPaymentMethodName: 'Cryptocurrency', bActive: true }
        ])
        .then(async () => {
            return;
        })
      }).catch(err => console.log(err));
};