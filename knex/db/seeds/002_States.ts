
exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('States').del()
        .then(function () {
            // countries ids (Mexico and US)
            const mx_id = '236ce2ad-d8d8-41eb-8451-a0c7c6a7434b';

            // array of Mexico states. Structure of object: sStateId, sName, sCountryId
            const mx_states = [
                { sStateId: "1ab1a61b-aed2-4243-a417-4451760a1019", sName: 'Aguascalientes', sCountryId: mx_id },
                { sStateId: "acd94f03-423a-48d6-a5d4-9990782233b0", sName: 'Baja California', sCountryId: mx_id },
                { sStateId: "7a4fffa6-fe90-46ea-b466-ba36b500aa35", sName: 'Baja California Sur', sCountryId: mx_id },
                { sStateId: "7727e73e-fa27-4e2c-8ee3-ab4b5c89e409", sName: 'Chihuahua', sCountryId: mx_id },
                { sStateId: "100d6a53-2994-400a-b95e-0608fea83165", sName: 'Chiapas', sCountryId: mx_id },
                { sStateId: "bf52c396-4602-43fa-97df-0d0cf00d2edf", sName: 'Campeche', sCountryId: mx_id },
                { sStateId: "f58f9651-6bdc-41a3-aa1b-f8cf1e3bbca3", sName: 'Ciudad de México', sCountryId: mx_id },
                { sStateId: "ab68dba5-ba44-4a1d-891a-5c291c1a6657", sName: 'Coahuila', sCountryId: mx_id },
                { sStateId: "8a2ec8fc-dfc2-4a32-af8d-fb5a825d0afd", sName: 'Colima', sCountryId: mx_id },
                { sStateId: "91c98a1f-27bc-40a8-9599-cdea5bbceffb", sName: 'Durango', sCountryId: mx_id },
                { sStateId: "fd24abd3-b597-4685-ac78-c4935151a0fc", sName: 'Guerrero', sCountryId: mx_id },
                { sStateId: "27e6efc1-c88c-497f-b1a8-94ab6a42965b", sName: 'Guanajuato', sCountryId: mx_id },
                { sStateId: "14a3d2fe-3c48-4572-8812-2d0c8bf7a2f6", sName: 'Hidalgo', sCountryId: mx_id },
                { sStateId: "923bc878-a939-418d-a5f4-d7d872415b7b", sName: 'Jalisco', sCountryId: mx_id },
                { sStateId: "e609c735-cd81-458c-b3a9-995b13b1a23b", sName: 'Michoacan', sCountryId: mx_id },
                { sStateId: "9d90f43c-55e4-4f47-987f-d015778c4538", sName: 'Estado de México', sCountryId: mx_id },
                { sStateId: "d4f67637-a8c8-496a-8af9-b35e811d6170", sName: 'Morelos', sCountryId: mx_id },
                { sStateId: "1994281c-df81-4bcd-b3d8-def617f8702a", sName: 'Nayarit', sCountryId: mx_id },
                { sStateId: "36030259-16f9-43c8-856d-2854d7f6111b", sName: 'Nuevo León', sCountryId: mx_id },
                { sStateId: "e36101b7-a075-43b5-9b80-962a3041adfb", sName: 'Oaxaca', sCountryId: mx_id },
                { sStateId: "3a922893-d961-448f-a795-e3626320e446", sName: 'Puebla', sCountryId: mx_id },
                { sStateId: "7aad59ad-ab0d-4a4d-97f4-a106b5c2e43e", sName: 'Quintana Roo', sCountryId: mx_id },
                { sStateId: "7b7b51ab-1291-410c-a545-9a66fd639269", sName: 'Querétaro', sCountryId: mx_id },
                { sStateId: "74b8998a-f840-4ab2-8774-28c7dc0b0e3e", sName: 'Sinaloa', sCountryId: mx_id },
                { sStateId: "9e74a6c4-5b31-4830-86ed-26bc48432541", sName: 'San Luis Potosí', sCountryId: mx_id },
                { sStateId: "0dca545e-326e-4872-a294-e75dc80953c2", sName: 'Sonora', sCountryId: mx_id },
                { sStateId: "50a53d8a-3c73-4fd2-a145-48c057ad50e0", sName: 'Tabasco', sCountryId: mx_id },
                { sStateId: "9af8d6f0-83c2-4b6e-9328-5e84e9ad0641", sName: 'Tlaxcala', sCountryId: mx_id },
                { sStateId: "fd3e4b7a-c2ad-44ea-99da-856922281816", sName: 'Tamaulipas', sCountryId: mx_id },
                { sStateId: "71f3a17f-fa8e-4e09-a638-4df6fa9dd722", sName: 'Veracruz', sCountryId: mx_id },
                { sStateId: "db77050d-0a1c-438c-891b-46fb86b3b718", sName: 'Yucatán', sCountryId: mx_id },
                { sStateId: "36fc51ee-af22-45b5-a903-e2d92df9822e", sName: 'Zacatecas', sCountryId: mx_id }
            ];

            // Inserts seed entries
            return knex('States').insert(mx_states)
            .then(async () => {
                return;
            })

        });
};
