# Requerimiento frontend — Colegios en modo transferencia y errores de cobranza

**Fecha:** 28/ago/2026
**Prioridad:** ALTA — hay un cliente en producción afectado
**Repo:** `myVillage` (frontend)
**Backend:** ya desplegado, no hay que esperar nada del backend
**Esfuerzo estimado:** 2–3 horas

---

## 0. Contexto en dos párrafos

Un colegio puede pagar de dos formas, y lo decide el superadmin en la edición del colegio:

* **`sPaymentMethod = 'STRIPE'`** → cobro automático con tarjeta.
* **`sPaymentMethod = 'TRANSFER'`** → transferencia bancaria; el superadmin registra los pagos a
  mano. **Stripe no interviene en absoluto.**

Hoy, en producción, un colegio en **TRANSFER** ve la pantalla de Stripe completa: puede abrir el
formulario, capturar una tarjeta real y recibir un error confuso. Pasó con un cliente real el
27/ago. Este requerimiento cierra ese hueco por el lado de la interfaz.

> **Importante:** el backend ya rechaza esas llamadas con un 409. Eso es la **red de seguridad**,
> no la solución. La solución es no ofrecer una opción que no aplica.

---

## 1. Prender el flag `TRANSFER_BILLING_ENABLED`

**Archivo:** `app/utils/features.ts`

```diff
- export const TRANSFER_BILLING_ENABLED = false;
+ export const TRANSFER_BILLING_ENABLED = true;
```

### Por qué está apagado hoy

El comentario del flag dice: *"main (prod): false hasta que backend acepte los campos"*.

**Ese bloqueo ya no aplica.** El backend acepta y devuelve `sPaymentMethod`, `dMonthlyAmount` y
`tNextPaymentDate` desde que se desplegó la migración `3040_Schools_transferBilling`, que ya está
en producción. Se puede prender.

### Qué desbloquea

`app/pages/admin/billing/index.vue:169-171`:

```js
bIsTransfer() {
  return TRANSFER_BILLING_ENABLED && this.oSummary?.sPaymentMethod === 'TRANSFER';
}
```

Con el flag en `false`, `bIsTransfer` es **siempre** `false`, sin importar lo que diga el backend.
Y la plantilla es:

```vue
<div v-if="bIsTransfer">      <!-- tarjeta read-only de transferencia -->
<template v-else>              <!-- TODA la UI de Stripe -->
```

O sea: hoy **todos** los colegios caen en el `v-else` y ven Stripe. Con el flag en `true`, los que
están en TRANSFER ven `BillingTransferCard` (estado / monto mensual / próximo pago) y nunca ven el
formulario de tarjeta.

### Verificación

| Colegio | Esperado en `/admin/billing` |
|---|---|
| `sPaymentMethod = 'TRANSFER'` | Solo `BillingTransferCard`. **Ningún** botón de agregar tarjeta, ningún banner de morosidad, ningún botón de cancelar suscripción. |
| `sPaymentMethod = 'STRIPE'` | Todo igual que hoy. Sin cambios. |

⚠️ **Revisar al mergear `dev` → `main`.** El mismo archivo tiene `SHARED_STUDENTS_ENABLED = false`
con una nota parecida. **No lo prendas en este cambio** — es otra feature, con su propia validación
pendiente. Prende **solo** `TRANSFER_BILLING_ENABLED`.

---

## 2. Mostrar el mensaje real del backend en el formulario de tarjeta

**Archivo:** `app/components/billing/BillingCardForm.vue`, método `executeSubmit()` (~línea 114)

### El problema

```js
.catch(() => {
  this.sError = this.$t('billing.cards.setupError');   // ← el error real se tira a la basura
  return { bOk: false, sPaymentMethodId: '' };
})
```

El backend manda un mensaje específico y accionable en `response.data.message`. Este `.catch()` lo
descarta y pinta siempre *"No se pudo procesar la tarjeta. Verifica los datos e inténtalo de
nuevo."*

Costo real de esto: el cliente afectado veía "verifica los datos" cuando el problema **no tenía
nada que ver con sus datos**. Diagnosticarlo tomó una sesión entera de revisar Stripe y logs. Con
el mensaje real en pantalla habría sido inmediato.

### El cambio

```js
.catch((oError) => {
  this.sError = oError?.response?.data?.message || this.$t('billing.cards.setupError');
  return { bOk: false, sPaymentMethodId: '' };
})
```

Aplica el mismo criterio en las **tres** ramas que hoy ponen el mensaje genérico
(líneas ~127, ~134 y ~141): usar el mensaje del backend cuando exista, y caer al genérico solo
cuando no haya ninguno.

> Estilo: mantener `.then()` / `.catch()` / `.finally()`. **No** convertir a `async/await` con
> `try/catch` — lo prohíbe `CLAUDE.md`.

### Mensajes que el backend puede mandar aquí

| HTTP | Mensaje (`sp`) | Cuándo |
|---|---|---|
| 409 | `Este colegio paga por transferencia; no aplica el cobro con tarjeta.` | Colegio en TRANSFER (no debería pasar si el punto 1 está bien) |
| 403 | `Solo el usuario principal del colegio puede administrar los métodos de pago y la suscripción.` | Usuario secundario o FACULTY |
| 503 | `El módulo de cobranza no está configurado. Contacta al administrador.` | Falta la llave de Stripe en el servidor |
| 500 | *(mensaje de error del servidor)* | Ej. identificador de Stripe inválido guardado en BD |

---

## 3. Contrato del backend (referencia, no hay que cambiar nada)

### `GET /billing/summary`

Ya devuelve el campo que necesitas. No requiere llamada a Stripe, es barato de refrescar:

```json
{
  "results": {
    "sPaymentMethod": "TRANSFER",
    "dMonthlyAmount": 1500,
    "tNextPaymentDate": "2026-09-15",
    "sBillingStatus": "NONE",
    "sBillingMode": "FIXED",
    "dMonthlyTotal": 1500,
    "sCurrency": "MXN",
    "bTestMode": false
  }
}
```

`sPaymentMethod` viene con fallback `'TRANSFER'` si la columna estuviera vacía, así que **siempre
llega un valor**: nunca es `null` ni `undefined`.

### Endpoints que ahora responden 409 en modo TRANSFER

| Endpoint | Comportamiento nuevo |
|---|---|
| `POST /billing/setup-intent` | **409** en vez de devolver `sClientSecret` |
| `POST /billing/resubscribe` | **409** en vez de crear la suscripción |
| `POST /billing/payment-methods` | 409 (ya lo hacía antes, sin cambios) |

### Endpoints que **siguen funcionando** en modo TRANSFER — a propósito

`POST /billing/cancel`, `DELETE /billing/payment-methods/:id`,
`PUT /billing/payment-methods/:id/default`, `POST /billing/pay`, y todos los `GET`.

**Razón:** un colegio que se mueve de STRIPE a TRANSFER tiene que poder cancelar su suscripción
vieja y borrar sus tarjetas. Si eso se bloqueara, quedaría con Stripe cobrándole automáticamente
**y** el superadmin facturándole por transferencia al mismo tiempo.

Consecuencia para la UI: si un colegio en TRANSFER **todavía tiene** una suscripción o tarjetas
(porque antes era STRIPE), conviene que `BillingTransferCard` ofrezca una salida para limpiarlas.
Ver punto 5.

---

## 4. Pruebas a correr antes de dar por cerrado

Necesitas dos colegios de prueba, uno en cada modo. El superadmin los configura en
`/admin/schools/:id/edit`.

| # | Escenario | Resultado esperado |
|---|---|---|
| 1 | Colegio TRANSFER → `/admin/billing` | Solo `BillingTransferCard`. Sin formulario de tarjeta, sin banners de Stripe, sin botón de cancelar. |
| 2 | Colegio STRIPE → `/admin/billing` | Idéntico a hoy. Nada se rompió. |
| 3 | Colegio STRIPE con tarjeta inválida (`4000 0000 0000 0002`) | Se muestra el mensaje **de Stripe** ("Tu tarjeta fue rechazada"), no el genérico. |
| 4 | Colegio TRANSFER llamando `POST /billing/setup-intent` directo (Postman/curl) | 409 con el mensaje de transferencia. Confirma que la red de seguridad del backend está viva. |
| 5 | Usuario **secundario** (no principal) de un colegio STRIPE | No ve la sección de cobranza (`bIsMainUser`); si llega por URL, el backend responde 403 y ahora se ve ese mensaje. |

---

## 5. Opcional — solo si sobra tiempo

Un colegio que **era** STRIPE y pasó a TRANSFER puede quedar con una suscripción activa y tarjetas
guardadas. Hoy, con el punto 1 aplicado, deja de ver la UI para limpiarlas.

Propuesta: dentro de `BillingTransferCard`, cuando `sBillingStatus` sea distinto de `'NONE'`,
mostrar un aviso del tipo *"Este colegio tiene una suscripción de Stripe activa"* con un botón que
llame `POST /billing/cancel` (ese endpoint sigue permitido en TRANSFER justamente para esto).

**No es bloqueante.** Es un caso de borde que hoy no existe en producción. Levántalo como ticket
aparte si no da tiempo — pero no lo dejes sin registrar, porque cuando pase va a ser invisible.

---

## 6. Resumen ejecutable

```
□ app/utils/features.ts          → TRANSFER_BILLING_ENABLED = true
□ BillingCardForm.vue            → 3 ramas usan oError.response.data.message con fallback
□ probar los 5 escenarios del punto 4
□ NO tocar SHARED_STUDENTS_ENABLED
□ mantener .then()/.catch()/.finally(), nunca async/await con try/catch
```

Dudas sobre el contrato del backend: todo está en
[`README.md`](README.md) de esta carpeta y en `documentationForFront/NewScopeAug2026/frontEndChanges.md`.
