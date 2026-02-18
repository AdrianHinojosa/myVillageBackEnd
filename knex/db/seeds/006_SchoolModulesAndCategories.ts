exports.seed = async function (knex) {
    // Delete in correct order to respect foreign key constraints
    await knex('SchoolPermissions').del();
    await knex('SchoolModules').del();
    await knex('SchoolModuleCategories').del();

    // Insert General category with fixed UUID
    await knex('SchoolModuleCategories').insert([
        {
            sSchoolModuleCategoryId: '6a4c3811-189a-4c42-b73b-98c4246bb171',
            sIcon: 'mdi-view-dashboard',
            sNameSP: 'General',
            sNameEN: 'General',
            sDescriptionSP: 'Categoría general para módulos de escuelas',
            sDescriptionEN: 'General category for school modules'
        }
    ]);

    // Insert General module with fixed UUID
    return knex('SchoolModules').insert([
        {
            sSchoolModuleId: 'd7706bd1-b7af-48fb-a565-006ddeedb429',
            sSchoolModuleCategoryId: '6a4c3811-189a-4c42-b73b-98c4246bb171',
            iType: 0,
            sUniqueName: 'General',
            sNameSP: 'General',
            sNameEN: 'General',
            sDescriptionSP: 'Módulo general de gestión escolar',
            sDescriptionEN: 'General school management module'
        }
    ])
    .catch(err => {
        console.log(err);
    });
};
