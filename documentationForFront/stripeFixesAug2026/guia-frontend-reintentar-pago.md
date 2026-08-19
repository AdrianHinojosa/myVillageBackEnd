# Guía frontend — recuperación de un colegio suspendido ("Reintentar pago")

**Fecha:** 19/agosto/2026
**Origen:** reporte de pruebas en DEV (2 bugs en el flujo de suspensión) + un hueco que el reporte
detectó a medias: no existía ningún endpoint capaz de cobrar.
**Estado backend:** ✅ implementado y probado contra la API real (7/7 aserciones)

---

## El problema, en una frase

Un colegio suspendido por falta de pago **no podía volver a pagar**. El mensaje decía *"Regulariza el
pago para restaurar el acceso"* mientras **todos** los endpoints de cobranza respondían **402**,
incluidos los que sirven para pagar. Una suspensión de la que nadie puede salir no es una suspensión,
es una baja.

Eran tres cosas, no dos:

| # | Qué | Dónde se arregla |
|---|---|---|
| 1 | Stripe **cancelaba** la suscripción al agotar los reintentos | ⚠️ **configuración del dashboard de Stripe** — no es código |
| 2 | Los endpoints de cobranza respondían 402 estando suspendido | ✅ backend |
| 3 | **No existía** ningún endpoint que cobrara | ✅ backend — endpoint nuevo |

---

## 1. ⚠️ Lo que NO es código: la configuración de Stripe

El reporte proponía *"backend: al suspender, NO cancelar la suscripción de Stripe"*. Se revisó el
código y **el backend nunca cancela nada** por un pago fallido. Al recibir `invoice.payment_failed`
solo hace esto:

```js
iFailedAttempts: iAttempts,
sBillingStatus: bExhausted ? 'SUSPENDED' : 'PAST_DUE'
```

El único `cancel_at_period_end: true` del proyecto está en `POST /billing/cancel`, que es una acción
deliberada del usuario. Así que **el `canceled` viene del dashboard de Stripe**, no de nosotros:

> Stripe → **Settings → Billing → Subscriptions → "Manage failed payments"** →
> cambiar *"Cancel subscription"* por **"Mark subscription as unpaid"**

Sin ese cambio, la suscripción llega a `canceled` (estado terminal) y **nada de lo de abajo sirve**:
no hay factura abierta que cobrar ni suscripción que reactivar. Es el primer paso, y lo tiene que
hacer alguien con acceso al dashboard.

---

## 2. ✅ Los endpoints de recuperación ya NO responden 402

La suspensión se aplica en `verifySchoolUserPermissions`, que usan **todas** las rutas de colegio.
Ahora acepta una opción `bAllowWhenSuspended`, activada únicamente en las rutas que un colegio
moroso necesita para pagar.

El contrato dice restringir *"el acceso a la plataforma"* — alumnos, metas, IEP — no la caja.

### Comportamiento con el colegio SUSPENDIDO

| Endpoint | Antes | Ahora |
|---|---|---|
| `GET /billing/summary` | 402 | **200** |
| `GET /billing/payments` | 402 | **200** |
| `GET /billing/payment-methods` | 402 | **200** |
| `POST /billing/setup-intent` | 402 | **200** |
| `POST /billing/payment-methods` | 402 | **200** |
| `PUT /billing/payment-methods/:id/default` | 402 | **200** |
| `DELETE /billing/payment-methods/:id` | 402 | **200** |
| **`POST /billing/pay`** *(nuevo)* | — | **200** |
| `POST /billing/cancel` | 402 | **402** — sigue bloqueado |
| `/students`, `/goals`, `/iep`, todo lo demás | 402 | **402** — sin cambio |

**Por qué `/billing/cancel` sigue bloqueado:** cancelar estando moroso no debería ser la salida. Es
una decisión de producto, no técnica — si se quiere abrir, es una línea.

---

## 3. ✅ Endpoint nuevo: `POST /billing/pay`

**El botón "Reintentar pago".** Cobra la factura pendiente en el momento.

Existe porque **nada más lo hacía**: cuando suspendemos, los reintentos automáticos de Stripe ya se
agotaron, y **registrar una tarjeta nueva NO provoca ningún cobro**. Sin este endpoint el colegio
actualizaba su tarjeta y se quedaba bloqueado igual.

Es explícito a propósito, no automático al guardar la tarjeta: el usuario aprieta un botón que dice
cuánto va a pagar, así un cargo nunca es un efecto secundario sorpresa de guardar una tarjeta.

### Contrato

```
POST /billing/pay
Authorization: Bearer <token del usuario PRINCIPAL del colegio>
body: {}   (vacío)
```

**200 — pagado**

```json
{
  "message": "Pago procesado exitosamente! El acceso se restablece en unos segundos.",
  "results": {
    "sInvoiceId": "in_1U5...",
    "dAmountPaid": 2250,
    "sCurrency": "MXN",
    "bPaid": true,
    "sStatus": "paid"
  },
  "success": true
}
```

**Errores**

| Código | Cuándo | Mensaje |
|---|---|---|
| **409** | no hay factura abierta | *"No hay un cobro pendiente por pagar en este momento."* |
| **409** | no hay tarjeta predeterminada | *"Registra una tarjeta y márcala como predeterminada antes de reintentar el pago."* |
| **409** | la tarjeta fue rechazada otra vez | *"No pudimos procesar el pago con la tarjeta registrada. Verifica los datos o usa otra tarjeta."* |
| **403** | no es el usuario principal del colegio | solo el principal administra la suscripción |
| **503** | el ambiente no tiene llaves de Stripe | no es error del usuario |

> ⚠️ **Un rechazo devuelve 409, NUNCA 402.** A propósito: el interceptor de axios trata el 402 como
> "colegio suspendido" y redirige — expulsaría al usuario de la única pantalla donde puede pagar.
> Si algún día ven un 402 aquí, es un bug.

### Reglas de negocio

1. **Solo el usuario principal** del colegio (`bIsMainUser`). FACULTY no llega.
2. **Debe haber tarjeta predeterminada.** `invoices.pay()` cobra la predeterminada del cliente, no
   "la última que agregaste". Si el colegio tiene la tarjeta mala como predeterminada y agrega una
   buena, hay que hacer `PUT /billing/payment-methods/:id/default` **antes** de pagar.
3. **Cobra la factura abierta más reciente.** Si no hay ninguna, 409 — no inventa un cargo.
4. **El backend NO escribe `sBillingStatus` aquí.** Lo hace el webhook al recibir
   `invoice.payment_succeeded`, que es el único lugar que traduce el estado de Stripe al nuestro. Dos
   escritores para un mismo campo es como se desincronizan.
   **Consecuencia para el frontend:** justo después del 200, `sBillingStatus` puede seguir diciendo
   `SUSPENDED` unos segundos. Ver abajo.
5. **`iFailedAttempts` se reinicia a 0** — ese contador sí es nuestro.

---

## Lo que el frontend tiene que hacer

### a) El botón

En `/admin/billing`, visible cuando `sBillingStatus === 'SUSPENDED'` o `'PAST_DUE'`:

```
[ Reintentar pago — $2,250.00 MXN ]
```

El monto sale de `GET /billing/summary` → `dMonthlyTotal`. Ese endpoint **ya responde 200** estando
suspendido, así que se puede pintar el importe real.

### b) El orden que hay que guiar

La pantalla de suspensión debería llevar al usuario por aquí, en este orden:

1. **Agregar tarjeta** → `POST /billing/setup-intent` + Stripe.js + `POST /billing/payment-methods`
2. **Marcarla como predeterminada** → `PUT /billing/payment-methods/:id/default`
   ← **paso que se olvida.** Al agregar una segunda tarjeta **no** queda predeterminada
   automáticamente (solo la primera lo hace), así que sin este paso el reintento vuelve a cobrar a la
   tarjeta mala.
3. **Reintentar pago** → `POST /billing/pay`

### c) Tras el 200: no confíes en el estado inmediato

El webhook tarda un momento. Recomendación:

```js
$api.post('/billing/pay', {})
  .then(() => {
    // el estado real llega por webhook; volver a leer, no asumir
    return $api.get('/billing/summary', { silent: true });
  })
  .then((oResponse) => {
    const sStatus = (oResponse.data.results || {}).sBillingStatus;
    if (sStatus !== 'SUSPENDED') {
      // acceso restaurado: refrescar la sesión para que el middleware deje pasar
      return $api.post('/auth/refresh-session'); // o volver a loguear / recargar
    }
    // aún suspendido: mostrar "estamos confirmando tu pago" y reintentar la lectura
  });
```

⚠️ **`sBillingStatus` vive en el objeto de usuario del login**, persistido en `localStorage.mv_user`.
Aunque el backend ya diga `ACTIVE`, el middleware global sigue leyendo el valor viejo y manda a
`/admin/suspended`. Hay que **actualizar ese valor** (o forzar re-login) al confirmar el pago.

### d) Manejo de errores

Los tres 409 son mensajes distintos y accionables — muéstralos tal cual vienen en `message`, no un
"algo salió mal" genérico. En particular el de *"registra una tarjeta y márcala como predeterminada"*
le dice al usuario exactamente qué le falta.

---

## Lo que NO cambió

* Ningún endpoint existente cambió de forma, envelope ni nombre de campo.
* `POST /billing/cancel` sigue igual (y sigue bloqueado durante la suspensión).
* La lógica de suspensión sigue siendo la misma: 3 intentos fallidos → `SUSPENDED`, sin periodo de
  gracia, sin borrar datos.
* El resto de la plataforma (`/students`, `/goals`, `/iep`, …) sigue devolviendo **402** durante la
  suspensión. Eso es lo que el contrato pide.

---

## Cómo se verificó

Contra la API real, forzando el colegio a `SUSPENDED` y restaurando su estado al terminar:

```
RECOVERY endpoints must NOT be 402 anymore:
  PASS  GET  /billing/summary               200
  PASS  GET  /billing/payments              200
  PASS  GET  /billing/payment-methods       200
  PASS  POST /billing/setup-intent          no 402
  PASS  POST /billing/pay                   200  "Pago procesado exitosamente!"
NON-billing must STILL be 402:
  PASS  GET /students                       402
  PASS  POST /billing/cancel stays blocked  402

passed 7  failed 0
```

`POST /billing/pay` devolvió **200** con una factura real del sandbox, así que el camino del dinero
está probado de punta a punta, no solo el de permisos.

---

## Pendientes que no son de frontend

1. **Cambiar la opción de Stripe** (punto 1). Sin eso, la suscripción sigue llegando a `canceled` y
   no hay factura que cobrar.
2. **`STRIPE_WEBHOOK_SECRET` en el servidor.** Sin webhook, el pago se cobra pero `sBillingStatus`
   nunca vuelve a `ACTIVE` por sí solo y el historial de pagos queda vacío.
