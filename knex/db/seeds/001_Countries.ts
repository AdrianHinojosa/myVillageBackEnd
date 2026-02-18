
exports.seed = async function (knex) {

    await knex("Cities").del();
    await knex('States').del()

    // Deletes ALL existing entries
    return knex('Countries').del()
        .then(function () {
            const mx_id = '236ce2ad-d8d8-41eb-8451-a0c7c6a7434b';
            // Inserts seed entries
            return knex('Countries').insert([
                { sCountryId: mx_id, sName: 'México', sCode: 'MX'}
            ])
            .then(async () => {
               return;
            })
        }).catch(err => {
            console.log(err);
        });
};
    