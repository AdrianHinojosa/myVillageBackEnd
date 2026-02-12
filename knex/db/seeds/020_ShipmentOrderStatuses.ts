exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('ShipmentOrderStatuses').del()
        .then(function () {
            // Inserts seed entries
            return knex('ShipmentOrderStatuses').insert([
                { sShipmentOrderStatusId: '5e1e1235-ff98-4b9f-b54c-5f2d4734f782', sStatusNameSP: 'Pendiente', sStatusNameEN: 'Pending', iOrder: 1, sStatusCode: 'PENDING', sColorHex: '#F8DE7E' },
                { sShipmentOrderStatusId: '98b6106c-bd48-438a-862f-741fb0a3bf44', sStatusNameSP: 'Última milla', sStatusNameEN: 'Last Mile', iOrder: 2, sStatusCode: 'LAST_MILE', sColorHex: '#00a6ff' },
                { sShipmentOrderStatusId: 'a97e3334-e8e4-46b4-b63d-548be4c01695', sStatusNameSP: 'En tránsito', sStatusNameEN: 'On Transit', iOrder: 3, sStatusCode: 'ON_TRANSIT', sColorHex: '#7b00ff' },
                { sShipmentOrderStatusId: '00bb9ab3-ca94-433a-bcde-b04ac8523bee', sStatusNameSP: 'Esperando cita', sStatusNameEN: 'Waiting for Appointment', iOrder: 4, sStatusCode: 'WAITING_APPOINTMENT', sColorHex: '#eaff00' },
                { sShipmentOrderStatusId: 'bc25fb8e-ce13-4a05-8a10-6cc0d53bc5b5', sStatusNameSP: 'Entregado', sStatusNameEN: 'Delivered', iOrder: 5, sStatusCode: 'DELIVERED', sColorHex: '#41ba20' },
                { sShipmentOrderStatusId: '984a36ed-edd3-4a59-b457-9d0c2feb5976', sStatusNameSP: 'Cancelado', sStatusNameEN: 'Cancelled', iOrder: 6, sStatusCode: 'CANCELLED', sColorHex: '#ff3224' },
            ])
            .then(async () => {
                return;
            })
        }).catch(err => {
            console.log(err);
        });
};
