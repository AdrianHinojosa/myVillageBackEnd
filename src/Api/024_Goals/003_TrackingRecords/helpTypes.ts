/**
 * Punto 8 — Tipos de ayuda: the vocabulary and the wire↔storage translation.
 *
 * The frontend sends lowercase Spanish slugs (`visual`), which is what `app/utils/helpTypes.ts`
 * already uses for its labels and chart colours. The database stores the UPPERCASE codes already
 * documented for this concept on `TrackingRecords.sSupportUsed`, matching the casing of every
 * other coded value in the schema (`sStatus`, `sMeasurementType`, `sDirection`).
 *
 * Translating here keeps both sides idiomatic. This codebase already does the same for field
 * names (`iCorrect`↔`iHits`, `dtDate`↔`tRecordDate`, `sNotes`↔`sObservations`).
 */

// Wire (frontend slug) -> stored code
export const HELP_TYPE_SLUG_TO_CODE: { [key: string]: string } = {
    independiente: 'INDEPENDENT',
    ayuda_general: 'GENERAL',
    visual: 'VISUAL',
    verbal: 'VERBAL',
    escrita: 'WRITTEN',
    gestual: 'GESTURAL',
    modelacion: 'MODELING',
    fisica: 'PHYSICAL'
};

// Stored code -> wire (frontend slug)
export const HELP_TYPE_CODE_TO_SLUG: { [key: string]: string } = Object.keys(HELP_TYPE_SLUG_TO_CODE)
    .reduce((oAcc, sSlug) => {
        oAcc[HELP_TYPE_SLUG_TO_CODE[sSlug]] = sSlug;
        return oAcc;
    }, {} as { [key: string]: string });

// Accepted values on the wire, for Joi.
export const HELP_TYPE_SLUGS: string[] = Object.keys(HELP_TYPE_SLUG_TO_CODE);

// There are only 8 types and one row per type per record, so this caps the array.
export const MAX_HELP_TYPES_PER_RECORD: number = HELP_TYPE_SLUGS.length;

// PO-confirmed range for the amount of help given.
export const MIN_HELP_AMOUNT: number = 0;
export const MAX_HELP_AMOUNT: number = 10;

/**
 * Normalise whatever the client sent into a clean list of `{ sHelpType (code), iHelpAmount }`.
 *
 * Accepts the current contract (`aHelpTypes` array) and, as a TEMPORARY compatibility shim, the
 * single `sHelpType` + `iHelpAmount` pair the frontend sends today. Remove the shim once the
 * frontend ships the multi-type capture UI (see frontEndChanges.md entry 1).
 *
 * Returns `null` when the client said nothing about help types at all — callers use that to mean
 * "leave whatever is already stored alone", which is different from `[]` meaning "clear it".
 */
export function normalizeHelpTypesInput(oData: any): Array<{ sHelpType: string, iHelpAmount: number }> | null {
    let aInput: any[] | null = null;

    if (Array.isArray(oData?.aHelpTypes)) {
        aInput = oData.aHelpTypes;
    } else if (oData?.aHelpTypes === null) {
        // Explicit null clears the set.
        aInput = [];
    } else if (oData?.sHelpType) {
        // TEMPORARY legacy shim — single help type becomes a one-item list.
        aInput = [{ sHelpType: oData.sHelpType, iHelpAmount: oData.iHelpAmount }];
    } else {
        return null;
    }

    return aInput
        .filter((oItem: any) => oItem && HELP_TYPE_SLUG_TO_CODE[oItem.sHelpType])
        .map((oItem: any) => ({
            sHelpType: HELP_TYPE_SLUG_TO_CODE[oItem.sHelpType],
            iHelpAmount: Number.isFinite(Number(oItem.iHelpAmount)) ? Number(oItem.iHelpAmount) : 0
        }));
}

/** Turn stored rows back into the wire shape the frontend expects. */
export function formatHelpTypesForFrontend(aRows: any[]): Array<{ sHelpType: string, iHelpAmount: number }> {
    return (aRows || []).map((oRow: any) => ({
        sHelpType: HELP_TYPE_CODE_TO_SLUG[oRow.sHelpType] || oRow.sHelpType,
        iHelpAmount: oRow.iHelpAmount
    }));
}
