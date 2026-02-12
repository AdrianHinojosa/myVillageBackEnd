exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('PreShipmentStatuses').del()
        .then(function () {
            // Inserts seed entries
            return knex('PreShipmentStatuses').insert([
                { sPreShipmentStatusId: '55c290c7-6f3b-42bf-a089-b9ccb7c00556', sStatusNameSP: 'Creado', sStatusNameEN: 'Created', iOrder: 1, sColorHex: '#adaaaa' },
                { sPreShipmentStatusId: '01b92f19-81b2-4ada-a049-6d24903976f3', sStatusNameSP: 'Esperando respuesta', sStatusNameEN: 'Awaiting Response', iOrder: 2, sColorHex: '#F8DE7E'},
                { sPreShipmentStatusId: '8b55dfcc-b0db-4832-bdc5-25d43455a2ec', sStatusNameSP: 'Rechazado', sStatusNameEN: 'Declined', iOrder: 3, sColorHex: '#ff7417' },
                { sPreShipmentStatusId: 'd0c6e413-3cd3-4bb5-8380-b16c12fbbca8', sStatusNameSP: 'Aprobado', sStatusNameEN: 'Approved', iOrder: 4, sColorHex: '#41ba20' },
                { sPreShipmentStatusId: '86a4b574-5e9f-41a7-b615-699c43c51bc4', sStatusNameSP: 'Sin Respuesta', sStatusNameEN: 'No response', iOrder: 5, sColorHex: '#ff6f00' },
                { sPreShipmentStatusId: 'db5c520b-fc97-4ecb-87f0-a7d8528a3884', sStatusNameSP: 'Cancelado', sStatusNameEN: 'Cancelled', iOrder: 5, sColorHex: '#ff3224' },
            ])
            .then(async () => {
                return;
            })
        }).catch(err => {
            console.log(err);
        });
};
