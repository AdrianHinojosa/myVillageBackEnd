exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('ShipmentStatuses').del()
        .then(function () {
            // Inserts seed entries
            return knex('ShipmentStatuses').insert([
                { sShipmentStatusId: '9c1b65f6-7866-4924-a935-c746387afe63', sStatusNameSP: 'Creado', sStatusNameEN: 'Created', iOrder: 1, sColorHex: '#adaaaa' },
                { sShipmentStatusId: 'fb2e9327-7b0a-4f7f-95e7-3496e8b9dfd5', sStatusNameSP: 'Parcialmente programado', sStatusNameEN: 'Partially scheduled', iOrder: 2, sColorHex: '#F8DE7E'},
                { sShipmentStatusId: '2aead2ed-0bda-44af-9771-fea0202b2ee6', sStatusNameSP: 'Programado', sStatusNameEN: 'Scheduled', iOrder: 3, sColorHex: '#eaff00' },
                { sShipmentStatusId: '850aa255-a04b-4dd3-87a6-11782d3d95b5', sStatusNameSP: 'En progreso', sStatusNameEN: 'In progress', iOrder: 4, sColorHex: '#00a6ff' },
                { sShipmentStatusId: 'f5677abf-c7de-4b53-b752-2cf3b92618f6', sStatusNameSP: 'Demorado', sStatusNameEN: 'Delayed', iOrder: 5, sColorHex: '#ff7417' },
                { sShipmentStatusId: 'c2b6fa5e-0925-41ce-915d-3a247957228f', sStatusNameSP: 'Entregado', sStatusNameEN: 'Delivered', iOrder: 6, sColorHex: '#41ba20' },
                { sShipmentStatusId: '80b9239e-65e3-45c9-bae4-b08711e10b47', sStatusNameSP: 'Cancelada', sStatusNameEN: 'Cancelled', iOrder: 7, sColorHex: '#ff3224' }
            ])
            .then(async () => {
                return;
            })
        }).catch(err => {
            console.log(err);
        });
};