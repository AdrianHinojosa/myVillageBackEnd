import * as Knex from "knex";

// Firmas del IEP (hasta 8 espacios). Se guarda como jsonb igual que `aTeamMembers`: la firma es
// parte del documento IEP (1:1, pocas y chicas) y su regla de invalidación ("al cambiar el
// contenido del IEP las firmas se recapturan") queda atómica sobre la misma fila. Cada elemento:
// { iSlot, sRole, sSignerName, sSignature(dataURL PNG), tSignedAt }.
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.jsonb('aSignatures').defaultTo('[]');
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('IEPs', (table: any) => {
        table.dropColumn('aSignatures');
    });
}
