
exports.seed = async function (knex) {
        
    await knex("Cities").del();
    await knex('States').del()

    // Deletes ALL existing entries
    return knex('Countries').del()
        .then(function () {
            const [us_id, mx_id] = ['4ea76b09-621b-4518-814d-62582395d9f1', '236ce2ad-d8d8-41eb-8451-a0c7c6a7434b']
            // Inserts seed entries
            return knex('Countries').insert([
                { sCountryId: us_id, sName: 'Estados Unidos de América', sCode: 'US'},
                { sCountryId: mx_id, sName: 'México', sCode: 'MX'}
            ])
            .then(async () => {
               return;
            })
        }).catch(err => {
            console.log(err);
        });
};
    