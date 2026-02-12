exports.seed = function (knex) {
    // Deletes ALL existing entries in the Currencies table
    return knex('Currencies').del()
        .then(function () {
            // Inserts seed entries for the Currencies table
            return knex('Currencies').insert([
                { sCurrencyId: 'a1b2c3d4-e5f6-4789-9012-345678901234', sCurrencyNameSP: 'PESO MEXICANO', sCurrencyNameEN: 'MEXICAN PESO', sCurrencyCode: 'MXN' },
                { sCurrencyId: 'f1e2d3c4-b5a6-4789-9012-987654321abc', sCurrencyNameSP: 'DOLAR ESTADOUNIDENSE', sCurrencyNameEN: 'AMERICAN DOLLAR', sCurrencyCode: 'USD' }
            ]);
        }).catch(err => {
            console.log(err);
        });
};