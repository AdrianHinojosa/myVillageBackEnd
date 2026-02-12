exports.seed = function (knex) {
    // Insert initial exchange rate for MXN only (USD is base currency, no rate needed)
    return knex('ExchangeRates')
        .where('sCurrencyId', 'a1b2c3d4-e5f6-4789-9012-345678901234') // MXN currency ID from your seed
        .first()
        .then(function (existingRate) {
            // Only insert if no rate exists for MXN
            if (!existingRate) {
                return knex('ExchangeRates').insert([
                    {
                        sCurrencyId: 'a1b2c3d4-e5f6-4789-9012-345678901234', // MXN currency ID
                        dRate: 18.662, // 1 USD = 18.662 MXN
                        sSource: 'MANUAL',
                        bActive: true
                    }
                ]);
            } else {
                console.log('Exchange rate for MXN already exists, skipping insert');
                return Promise.resolve();
            }
        })
        .catch(err => {
            console.log('Error seeding exchange rates:', err);
        });
};