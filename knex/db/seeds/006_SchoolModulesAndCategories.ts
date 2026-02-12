exports.seed = async function (knex) {
    // Delete in correct order to respect foreign key constraints
    await knex('SchoolPermissions').del();
    await knex('SchoolModules').del();
    await knex('SchoolModuleCategories').del();

    // Insert General category with fixed UUID
    await knex('SchoolModuleCategories').insert([
        {
            sSchoolModuleCategoryId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
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
            sSchoolModuleId: 'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
            sSchoolModuleCategoryId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
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
