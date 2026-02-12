exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('ShipmentLegStatuses').del()
        .then(function () {
            // Inserts seed entries
            return knex('ShipmentLegStatuses').insert([
                { sShipmentLegStatusId: 'ad6b76a3-6b7f-4a33-a157-a27f1cd89fba', sStatusNameSP: 'PreShipment', sStatusNameEN: 'PreShipment', iOrder: 1, sColorHex: '#adaaaa' },
                { sShipmentLegStatusId: '53fb3937-a7ea-4cf3-9454-3b15cad55e60', sStatusNameSP: 'Programado', sStatusNameEN: 'Scheduled', iOrder: 2, sColorHex: '#F8DE7E'},
                { sShipmentLegStatusId: 'ef903880-5c92-490f-b5fc-1ceafdd091f5', sStatusNameSP: 'Cargando', sStatusNameEN: 'Loading', iOrder: 3, sColorHex: '#eaff00' },
                { sShipmentLegStatusId: 'a648fe98-0205-4bab-9693-3d1fe70eb5aa', sStatusNameSP: 'En tránsito', sStatusNameEN: 'On Transit', iOrder: 4, sColorHex: '#00a6ff' },
                { sShipmentLegStatusId: '9b5f0df1-5362-4f86-868f-041f06f40ce1', sStatusNameSP: 'En frontera', sStatusNameEN: 'At border', iOrder: 5, sColorHex: '#7b00ff' },
                { sShipmentLegStatusId: 'baafb85a-8666-443f-b458-56d279a614ca', sStatusNameSP: 'En destino', sStatusNameEN: 'At destination', iOrder: 6, sColorHex: '#c3ff00' },
                { sShipmentLegStatusId: '29bf8fb9-1041-4389-84d0-a105f675e169', sStatusNameSP: 'En descarga', sStatusNameEN: 'Unloading', iOrder: 7, sColorHex: '#7bff00' },
                { sShipmentLegStatusId: '8253af08-6800-461d-9662-48237f5d42f6', sStatusNameSP: 'Entregado', sStatusNameEN: 'Delivered', iOrder: 8, sColorHex: '#41ba20' },
                { sShipmentLegStatusId: '115be908-edfe-420a-aa78-a18516c9d306', sStatusNameSP: 'Cancelada', sStatusNameEN: 'Cancelled', iOrder: 9, sColorHex: '#ff3224' },
                { sShipmentLegStatusId: 'e29fd412-aad2-4433-aacf-6269d0371390', sStatusNameSP: 'Demorado', sStatusNameEN: 'Delayed', iOrder: 10, sColorHex: '#ff7417' },
            ])
            .then(async () => {
                return;
            })
        }).catch(err => {
            console.log(err);
        });
};