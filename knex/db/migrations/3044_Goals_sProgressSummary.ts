import * as Knex from "knex";

/**
 * Feature — Resumen cualitativo de progreso por meta/submeta (feedback Lucy 2026-10).
 *
 * Texto libre que el terapeuta escribe para explicar en palabras cómo avanzó, mostrado debajo de
 * "últimos registros" en la plataforma y en el PDF del reporte. Sirve para no depender de 50
 * registros por meta.
 *
 * Como una submeta ES una fila en `Goals` (ver 3035_Goals_subGoals), este único campo cubre metas
 * y submetas por igual. Aditivo y nullable → las metas existentes quedan sin resumen (null).
 */
export async function up(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.text('sProgressSummary').nullable();
    });
}

export async function down(Knex): Promise<void> {
    return Knex.schema.alterTable('Goals', (table: any) => {
        table.dropColumn('sProgressSummary');
    });
}
