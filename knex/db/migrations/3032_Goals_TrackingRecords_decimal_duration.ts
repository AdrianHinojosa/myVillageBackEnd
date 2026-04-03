import * as Knex from "knex";

export async function up(Knex): Promise<void> {
    return Knex.schema.raw(`
        ALTER TABLE "Goals" ALTER COLUMN "iTargetDuration" TYPE DECIMAL;
        ALTER TABLE "TrackingRecords" ALTER COLUMN "iDurationMinutes" TYPE DECIMAL;
    `);
}

export async function down(Knex): Promise<void> {
    return Knex.schema.raw(`
        ALTER TABLE "Goals" ALTER COLUMN "iTargetDuration" TYPE INTEGER USING "iTargetDuration"::INTEGER;
        ALTER TABLE "TrackingRecords" ALTER COLUMN "iDurationMinutes" TYPE INTEGER USING "iDurationMinutes"::INTEGER;
    `);
}
