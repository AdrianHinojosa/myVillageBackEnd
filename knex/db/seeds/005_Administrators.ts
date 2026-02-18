exports.seed = async  function (knex) {

    await knex('Administrators').del();
    await knex('Users').del();

      // User IDs for reference
      const [myvillage_super_admin] = ['d18da271-888c-46dc-bc46-0175638ea894'];

      await knex('Users').insert([
            {
                sUserId: myvillage_super_admin,
                sName: 'MyVillage',
                sLastName: 'Admin',
                sEmail: 'admin@myvillage.com',
                // Pass is: MyVillage0!
                sPassword: '$2a$10$BsRejg/EVSfKZwBOAStfSemOz1SUdAwdNbHZ4bvFCpT1uPOZ6tDea',
                sPhoneNumber: '+521234567890',
                bPlatformAccess: true,
                bVerified: true,
                bActive: true,
            }
      ]);

      await knex('Administrators').insert([
        { sAdministratorId: myvillage_super_admin },
    ]);

};