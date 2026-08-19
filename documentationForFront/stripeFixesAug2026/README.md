# stripeFixesAug2026

Arreglos posteriores al cierre de P3 (Cobranza automática), a partir de pruebas contra DEV.

| Documento | Para quién | Qué contiene |
|---|---|---|
| [`guia-frontend-reintentar-pago.md`](guia-frontend-reintentar-pago.md) | **frontend** | El endpoint nuevo `POST /billing/pay`, los endpoints que dejaron de responder 402 durante una suspensión, las reglas de negocio de cada uno, y el flujo de 3 pasos que el usuario tiene que seguir para recuperarse |
| [`guia-frontend-reactivar-suscripcion.md`](guia-frontend-reactivar-suscripcion.md) | **frontend** | El endpoint nuevo `POST /billing/resubscribe`, la matriz de qué botón mostrar según `summary`, y la regla nueva: **la prueba de 30 días es una sola vez por colegio** |

## Resumen de lo que cambió y por qué

Un colegio suspendido por falta de pago no podía volver a pagar: el mensaje pedía regularizar el pago
mientras **todos** los endpoints de cobranza respondían 402, incluidos los que sirven para pagar.
Detectado probando el flujo completo en DEV con un test clock y una tarjeta que falla
(`4000 0000 0000 0341`).

| # | Problema | Owner | Estado |
|---|---|---|---|
| 1 | Stripe **cancelaba** la suscripción al agotar los reintentos → estado terminal, sin retorno | dashboard de Stripe (*Settings → Billing → Subscriptions → Manage failed payments*) | ⚠️ **pendiente** — no es código |
| 4 | El estado del colegio quedaba `ACTIVE` con la suscripción `canceled` en Stripe | backend | ✅ hecho — misma causa raíz que el punto 2 de abajo |
| 2 | El gate de suspensión devolvía 402 en `/billing/*`, incluidos los endpoints de recuperación | backend | ✅ hecho |
| 3 | **No existía** ningún endpoint capaz de cobrar la factura pendiente | backend | ✅ hecho — `POST /billing/pay` |
| 5 | Un colegio ya cancelado **con tarjeta guardada** no tenía forma de volver a suscribirse | backend | ✅ hecho — `POST /billing/resubscribe` |
| 6 | La prueba de 30 días se **regalaba de nuevo** en cada re-suscripción | backend | ✅ hecho — una sola vez por colegio |

El reporte original describía 1 y 2. El 3 salió al revisarlo: registrar una tarjeta nueva **no**
provoca ningún cobro, y los reintentos automáticos de Stripe ya estaban agotados en el momento de
suspender — así que con 1 y 2 arreglados el colegio seguía sin poder salir.

Sobre el punto 1 conviene ser preciso, porque el reporte pedía un cambio de backend que no aplica: el
backend **nunca** cancela una suscripción por un pago fallido. Solo cuenta el intento y marca
`PAST_DUE` / `SUSPENDED`. El `canceled` lo produce la configuración de dunning del dashboard.

## Cambios en el código

| Archivo | Cambio |
|---|---|
| `src/Middlewares/001_Permissions.mw.ts/schools.permissions.ts` | `verifySchoolUserPermissions` acepta `{ bAllowWhenSuspended }` |
| `src/Api/030_Billing/billing.routes.ts` | la opción activada en las 7 rutas de recuperación; `/cancel` NO; rutas nuevas `POST /pay` y `POST /resubscribe` |
| `src/Api/030_Billing/billing.controllers.ts` | `payOutstanding()` — cobra la factura abierta con la tarjeta predeterminada; `resubscribe()` — levanta la cancelación pendiente o crea una suscripción nueva; `bTrialAlreadyUsed()` — la prueba es una sola vez por colegio, aplicada también en `attachPaymentMethod()` |
| `src/Utils/ErrorMessages.util.ts` | `Billing.nothingToPay`, `Billing.noDefaultCard`, `Billing.paymentRetryFailed`, `Billing.alreadySubscribed` |
| `src/Utils/SuccessMessage.util.ts` | `Billing.payOutstanding`, `Billing.resubscribe` |

Sin migraciones. Sin cambios en endpoints existentes.

## Decisiones que vale la pena tener por escrito

* **El cobro es explícito, no automático al guardar la tarjeta.** El usuario aprieta un botón que
  dice cuánto va a pagar, así un cargo nunca es un efecto secundario de guardar una tarjeta.
* **Un rechazo devuelve 409, nunca 402.** El 402 significa "colegio suspendido" y el interceptor del
  frontend redirige con él — devolverlo aquí expulsaría al usuario de la pantalla donde está pagando.
* **`payOutstanding()` no escribe `sBillingStatus`.** Lo hace el webhook `invoice.payment_succeeded`,
  que es el único traductor de estado Stripe → nuestro. Dos escritores para un campo es como se
  desincronizan. Solo se reinicia `iFailedAttempts`, que es un contador propio.
* **`/billing/cancel` sigue bloqueado durante la suspensión.** Cancelar estando moroso no debería ser
  la salida. Decisión de producto, reversible en una línea.
* **`/billing/resubscribe` es un solo endpoint para los dos casos** (levantar una cancelación
  pendiente y crear una suscripción nueva). La interfaz necesita un botón, no dos, y decidir cuál de
  las dos cosas aplica requiere leer el estado real en Stripe — que es exactamente lo que el backend
  ya tiene que hacer.
* **`/billing/resubscribe` exige tarjeta predeterminada.** Sin tarjeta responde 409 pidiendo
  registrarla, en vez de crear una suscripción que nacería impaga.
* **La prueba de 30 días es una sola vez por colegio.** Se pregunta a Stripe si el customer tuvo
  alguna suscripción, incluidas las canceladas — sin columna nueva ni migración. Si esa consulta a
  Stripe falla, se **asume que la prueba ya se usó**: equivocarse cobrando es recuperable, equivocarse
  regalando un mes es dinero que se va sin que nadie lo note.

## Corrección al listado de pendientes (19/ago/2026)

La primera versión de la guía listaba `STRIPE_WEBHOOK_SECRET` como pendiente. **Ya estaba resuelto.**
El endpoint `we_1U5yzu…` existe en el sandbox desde el 19/ago 02:12 apuntando a
`.../development/api/v1/billing/webhook`, y la tabla `Payments` tiene filas de las 04:20, 04:26, 04:27
y 06:06 — todas posteriores. Esas filas las escribe únicamente el handler del webhook, y solo tras
validar la firma, lo cual es imposible sin el secreto en el servidor.

El pendiente real y más urgente es **desplegar dev**: mientras el servidor corra el build anterior,
`POST /billing/pay` responde 404 y el handler viejo sigue desincronizando el estado.

## Un bug extra que salió de esto

`handleInvoicePaid` escribía `sBillingStatus: 'ACTIVE'` en **cualquier** factura pagada. Dos
consecuencias, las dos reportadas por separado:

* Una suscripción con periodo de prueba: Stripe emite una factura de **$0 y la marca pagada de
  inmediato**, así que un colegio en sus 30 días de prueba aparecía como "activa".
* Después de que Stripe cancela por impago, pagar la factura vencida dejaba el colegio en `ACTIVE`
  **sin suscripción** — de ahí el "el colegio no tiene una suscripción activa que cancelar".

Ahora el estado se lee de la suscripción con `mapStripeStatus()` en lugar de asumirse. Stripe es dueño
del estado de la suscripción; nosotros lo reflejamos. Solo `iFailedAttempts` se limpia, porque ese
contador es nuestro.
