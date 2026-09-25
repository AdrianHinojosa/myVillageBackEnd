/**
 * Punto 18 — helpers de modalidad de cuenta.
 *
 * Las modalidades You / You+ (y el legacy THERAPIST, tratado como You) se cobran por uso REAL
 * (cuota base + excedente), NO por límite configurado. Por eso el tope de usuarios/alumnos
 * (`iUsersLimit`/`iStudentsLimit`) NO aplica a esas cuentas — solo a los colegios (SCHOOL).
 */
export function isQuotaBasedModality(sAccountType?: string | null): boolean {
    return sAccountType === 'YOU' || sAccountType === 'THERAPIST' || sAccountType === 'YOU_PLUS';
}
