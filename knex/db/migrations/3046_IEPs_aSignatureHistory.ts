import * as Knex from "knex";

// Historial (log) de reinicios de firmas del IEP. Cada vez que las firmas se invalidan (por editar
// el contenido del IEP o por cambiar una meta vinculada —su definición o su avance—), se guarda un
// snapshot ligero de quién había firmado y por qué se reinició. NO guarda la imagen de la firma.
// Cada elemento: { tResetAt, sReason('CONTENT_EDIT'|'GOAL_EDIT'|'GOAL_PROGRESS'),
//   aSigners:[{ iSlot, sRole, sSignerName, tSignedAt }] }.
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.jsonb('aSignatureHistory').defaultTo('[]');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.dropColumn('aSignatureHistory');
    });
}
