/**
 * Punto 18 — Fase 3: protección de datos de menores en la modalidad YOU (terapeuta independiente).
 *
 * En YOU el nombre del alumno se muestra enmascarado: primer nombre + iniciales de los apellidos
 * ("Lucía P. A."). Se aplica en las respuestas del backend para que el front NO reconstruya el
 * apellido a partir de las partes. NO aplica a SCHOOL ni a YOU_PLUS.
 */

/** True para la modalidad YOU (incluye el legacy THERAPIST, tratado como YOU). */
export function isYouModality(sAccountType?: string | null): boolean {
    return sAccountType === 'YOU' || sAccountType === 'THERAPIST';
}

/** Nombre enmascarado: primer nombre + iniciales de apellidos. Ej: ("Lucía","Potes","Aguirre") → "Lucía P. A." */
export function maskMinorName(sName?: string, sLastName?: string, sSecondLastName?: string): string {
    const sInitials = [sLastName, sSecondLastName]
        .filter(Boolean)
        .map((s: string) => s.trim().charAt(0).toUpperCase() + '.')
        .join(' ');
    return [(sName || '').trim(), sInitials].filter(Boolean).join(' ').trim();
}

/**
 * Enmascara el nombre de un alumno SOLO en modo YOU. Sobrescribe `sFullName` con el nombre
 * enmascarado. Por defecto suprime los apellidos crudos (`sLastName`/`sSecondLastName`) para que no
 * viajen en la respuesta; en el DETALLE se pasan `bKeepRawParts=true` porque el formulario de edición
 * del propio terapeuta los necesita para precargar (y no perder datos al guardar).
 * Muta y devuelve el mismo objeto. No-op en SCHOOL / YOU_PLUS.
 */
export function applyMinorNameMasking(oStudent: any, sAccountType?: string | null, bKeepRawParts: boolean = false): any {
    if (!oStudent || !isYouModality(sAccountType)) return oStudent;
    oStudent.sFullName = maskMinorName(oStudent.sName, oStudent.sLastName, oStudent.sSecondLastName);
    if (!bKeepRawParts) {
        oStudent.sLastName = null;
        oStudent.sSecondLastName = null;
    }
    return oStudent;
}
