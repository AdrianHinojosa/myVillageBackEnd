# Reactivar suscripción — `POST /billing/resubscribe`

**Fecha:** 19/ago/2026 · **Owner backend:** listo y desplegable · **Owner frontend:** un botón nuevo en
`/admin/billing`

Continuación de [`guia-frontend-reintentar-pago.md`](guia-frontend-reintentar-pago.md). Ese documento
resolvió "el colegio está suspendido y quiere pagar". Este resuelve el paso siguiente: **el colegio ya
no tiene suscripción y quiere volver.**

---

## 1. El hueco que cerramos

Una suscripción solo se creaba **dentro de `POST /billing/payment-methods`** (al registrar una
tarjeta), y solo cuando `sStripeSubscriptionId` estaba en `null`.

Consecuencia: un colegio al que Stripe ya le canceló la suscripción por impago, y que **ya tiene su
tarjeta guardada**, no tenía absolutamente nada que pudiera reactivarlo. El único disparador era
registrar una *segunda* tarjeta — algo que ningún usuario va a adivinar. Quedaba en un estado sin
salida por la vía de la interfaz.

También hay que ser preciso con lo que Stripe permite, porque cambia la acción:

| Situación en Stripe | Qué se puede hacer |
|---|---|
| **Cancelación pendiente** (`cancel_at_period_end: true`, la suscripción sigue viva) | Se **levanta** la bandera. No se recrea nada: conserva el periodo de facturación, el precio y el historial. |
| **Ya cancelada** (estado terminal) | Stripe **no** puede des-cancelar. Hay que **crear una suscripción nueva**. |

El endpoint cubre las dos, así que el frontend solo necesita **un** botón.

---

## 2. Contrato

```
POST {base}/billing/resubscribe
Authorization: Bearer <token>
(sin body)
```

| Requisito | Detalle |
|---|---|
| Solo usuario principal | Igual que el resto de las rutas que mutan cobranza (`bIsMainUser` del login) |
| FACULTY bloqueado | 403 |
| **Exento del gate 402** | Un colegio `SUSPENDED` **sí** puede llamarlo — igual que `POST /billing/pay` |
| Requiere tarjeta predeterminada | Si no hay, responde 409 pidiendo registrarla |
| Requiere tarifa configurada | Si no hay, responde 409 |

### Respuesta 200 — caso 1: se levantó la cancelación pendiente

```json
{
  "message": "Suscripción reactivada exitosamente!",
  "results": {
    "sSubscriptionId": "sub_1U…",
    "bRecreated": false,
    "bTrialGranted": false
  },
  "success": true
}
```

### Respuesta 200 — caso 2: se creó una suscripción nueva

```json
{
  "message": "Suscripción reactivada exitosamente!",
  "results": {
    "sSubscriptionId": "sub_1U…",
    "bRecreated": true,
    "bTrialGranted": false,
    "dMonthlyTotal": 1500,
    "sCurrency": "MXN"
  },
  "success": true
}
```

`bRecreated` es informativo, **no** hay que ramificar la lógica con él. Sirve para el texto del toast:
`bRecreated === true` significa que empieza un ciclo de cobro nuevo y ya hay un cargo en camino;
`false` significa que simplemente se canceló la cancelación y el ciclo vigente sigue igual.

### Errores

| HTTP | Mensaje (`sp`) | Cuándo | Qué debe hacer el frontend |
|---|---|---|---|
| 409 | `Tu colegio ya tiene una suscripción activa.` | La suscripción está viva y **sin** cancelación pendiente | No debió mostrarse el botón; refrescar `summary` |
| 409 | `Registra una tarjeta y márcala como predeterminada antes de reintentar el pago.` | No hay tarjeta predeterminada | Mandar al usuario al alta de tarjeta, no a un reintento |
| 409 | `Tu colegio no tiene una tarifa configurada. Contacta al administrador.` | Sin tarifa cobrable | Mensaje tal cual; lo arregla un admin de plataforma |
| 403 | `Solo el usuario principal…` | Usuario secundario o FACULTY | Ocultar el botón con `bIsMainUser` |
| 404 | `La escuela especificada no existe.` | — | — |
| 503 | `El módulo de cobranza no está configurado…` | Falta `STRIPE_SECRET_KEY` en el servidor | Mensaje tal cual |

Todo error de negocio es **409**, nunca 402. El interceptor de axios trata el 402 como "colegio
suspendido" y redirige — devolver 402 aquí expulsaría al usuario de la pantalla desde la que está
tratando de reactivar.

---

## 3. Qué botón mostrar — matriz

Todo sale de `GET /billing/summary`, que no llama a Stripe y por lo tanto es barato de refrescar:

| `sBillingStatus` | `bCancelAtPeriodEnd` | Botón |
|---|---|---|
| `SUSPENDED` | — | **Reintentar pago** (`POST /billing/pay`) — hay una factura abierta que cobrar |
| `CANCELED` | `true` | **Reactivar suscripción** → levanta la cancelación (caso 1) |
| `CANCELED` | `false` | **Reactivar suscripción** → crea una nueva (caso 2) |
| `ACTIVE` / `TRIALING` | `false` | Ninguno de los dos |
| `PAST_DUE` | — | Ninguno: Stripe sigue reintentando solo. Mostrar aviso, no botón |
| `NONE` | — | Flujo normal de alta: registrar tarjeta |

Caso borde que **sí** se va a dar: un colegio `SUSPENDED` cuya factura ya fue anulada por Stripe. El
botón "Reintentar pago" responde 409 `No hay un cobro pendiente por pagar en este momento.` — ahí
corresponde ofrecer **Reactivar suscripción**. Recomendación concreta: al recibir ese 409, en lugar de
solo mostrar el toast, cambiar el botón por "Reactivar suscripción".

Y el orden importa cuando hay deuda: si el colegio tiene factura abierta **y** la suscripción muerta,
primero `POST /billing/pay` (liquida el periodo que ya usó) y después `POST /billing/resubscribe`.
Pagar la factura vieja **no** revive la suscripción, y ahora el backend ya no finge que sí: el webhook
lee el estado real de la suscripción en lugar de asumir `ACTIVE`.

---

## 4. La prueba gratis es **una sola vez por colegio**

Decisión de producto (19/ago/2026): los 30 días de prueba son una concesión única. Un colegio **no**
consigue otro mes gratis dejando morir su suscripción y volviendo a suscribirse.

* Primera suscripción de la vida del colegio → `TRIALING`, 30 días, `bTrialGranted: true`.
* Cualquier reactivación posterior → cobro desde el ciclo en curso, `bTrialGranted: false`.

Aplica en **los dos** caminos: `POST /billing/payment-methods` (alta de tarjeta) y
`POST /billing/resubscribe`. Antes, el alta de tarjeta regalaba la prueba cada vez que
`sStripeSubscriptionId` estaba vacío — y una cancelación deja esa columna en `null`, así que el mes
gratis era repetible.

Se resuelve preguntándole a Stripe si ese customer tuvo **alguna** suscripción (incluidas las
canceladas). Sin migración, sin columna nueva, y Stripe no puede contradecirse a sí mismo.
`sStripeCustomerId` por sí solo no servía como señal: el customer se crea de forma perezosa en el
primer SetupIntent, así que un colegio primerizo ya tiene uno antes de suscribirse.

**Para el frontend:** no prometas "30 días gratis" en la pantalla de reactivación. Usa
`bTrialGranted` de la respuesta, o simplemente no menciones prueba en ese flujo.

---

## 5. Ejemplo

Estilo de `CLAUDE.md`: `.then()` / `.catch()` / `.finally()`, nunca `async/await` con `try/catch`.

```ts
const bReactivating = ref(false);

const reactivateSubscription = () => {
    bReactivating.value = true;

    $api.post('/billing/resubscribe')
        .then((oResponse) => {
            const oResults = oResponse?.data?.results || {};

            toast.success(oResults.bRecreated
                ? 'Suscripción reactivada. El cobro se reanuda en este ciclo.'
                : 'Se canceló la cancelación programada. Conservas tu periodo actual.');

            // El webhook de Stripe llega en segundos: refrescar para leer el estado real.
            return loadSummary();
        })
        .catch(() => {
            // El interceptor de axios ya muestra el mensaje del backend.
            // Refrescar de todas formas: un 409 "ya tiene una suscripción activa"
            // significa que la pantalla estaba viendo un estado viejo.
            loadSummary();
        })
        .finally(() => {
            bReactivating.value = false;
        });
};
```

Notas de implementación:

* El botón va en `app/pages/admin/billing/index.vue`, junto al de "Reintentar pago".
* Ocultarlo con `bIsMainUser` — el backend responde 403, pero no hay razón para mostrar un botón que
  va a fallar.
* Después de un 200, `sBillingStatus` puede tardar unos segundos en reflejarse: lo escribe el webhook,
  no la respuesta del endpoint. Un solo `loadSummary()` inmediato suele alcanzar porque el endpoint
  también escribe el estado que Stripe devolvió; si se ve desfasado, un segundo refresco a los ~3 s lo
  resuelve. No hace falta polling.

---

## 6. Lo que **no** hicimos, y por qué

**Pausar la suscripción en lugar de cancelarla.** Stripe tiene `pause_collection`: suspende el cobro
sin cancelar, con tres comportamientos para las facturas del periodo pausado (`void`,
`keep_as_draft`, `mark_uncollectible`). Es una función de producto legítima — un colegio que cierra en
verano podría querer dos meses sin cobro sin perder su suscripción — pero **no está en el contrato
firmado**, así que queda como decisión aparte. Pregunta abierta para Lucy: ¿"pausar suscripción" es
algo que los colegios usarían?

Para el caso de **impago** no se necesita: la configuración de dunning del dashboard de Stripe
(*Manage failed payments* → *Subscription status* → "mark the subscription as unpaid") ya es la pausa
— la suscripción sigue viva en `unpaid`, Stripe deja de reintentar, y se reactiva pagando. Ese cambio
sigue **pendiente en el dashboard** y no es código.

---

## 7. Comportamiento conocido que conviene tener presente

`CANCELED` **no** bloquea el acceso a la plataforma; solo `SUSPENDED` lo hace. Es intencional para la
cancelación voluntaria (el colegio pagó hasta la fecha de corte y conserva el acceso hasta entonces),
pero significa que un colegio cancelado por Stripe tras agotar los reintentos **sí sigue entrando**.
Cambiarlo es una línea en el gate, y es decisión de producto — no lo tocamos sin que se pida.

---

## 8. Verificación

Suite `src/unitTests/StripeSubscriptions` contra DEV, **12/12**:

| Escenario | Resultado |
|---|---|
| Primera suscripción | `TRIALING`, Stripe confirma `trialing` → prueba **otorgada** |
| Suscripción cancelada → `resubscribe` | `active`, `trial_end` en `null` → **sin** segundo mes gratis |
| `resubscribe` con suscripción activa | 409 |
| Cancelación pendiente → `resubscribe` | 200, `bRecreated: false`, `cancel_at_period_end` limpio, nada recreado |

`residue: 0` — la suite limpia sus propios colegios de prueba (`ZZTEST-STRIPE`).
