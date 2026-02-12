exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('AdministratorModules').del()
        .then(function () {
            // Inserts seed entries
            return knex('AdministratorModules').insert([
                { sAdministratorModuleId: knex.raw('uuid_generate_v4()'), sName: 'General', sDescriptionSP: 'Módulo general de administración para MyVillage.', sDescriptionEN: 'General administration module for MyVillage.' }
            ])
            .then(async () => {
                return;
            })
        }).catch(err => {
            console.log(err);
        });
};