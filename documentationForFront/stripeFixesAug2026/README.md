# stripeFixesAug2026

Arreglos posteriores al cierre de P3 (Cobranza automática), a partir de pruebas contra DEV.

| Documento | Para quién | Qué contiene |
|---|---|---|
| [`guia-frontend-reintentar-pago.md`](guia-frontend-reintentar-pago.md) | **frontend** | El endpoint nuevo `POST /billing/pay`, los endpoints que dejaron de responder 402 durante una suspensión, las reglas de negocio de cada uno, y el flujo de 3 pasos que el usuario tiene que seguir para recuperarse |

## Resumen de lo que cambió y por qué

Un colegio suspendido por falta de pago no podía volver a pagar: el mensaje pedía regularizar el pago
mientras **todos** los endpoints de cobranza respondían 402, incluidos los que sirven para pagar.
Detectado probando el flujo completo en DEV con un test clock y una tarjeta que falla
(`4000 0000 0000 0341`).

| # | Problema | Owner | Estado |
|---|---|---|---|
| 1 | Stripe **cancelaba** la suscripción al agotar los reintentos → estado terminal, sin retorno | dashboard de Stripe (*Settings → Billing → Subscriptions → Manage failed payments*) | ⚠️ **pendiente** — no es código |
| 2 | El gate de suspensión devolvía 402 en `/billing/*`, incluidos los endpoints de recuperación | backend | ✅ hecho |
| 3 | **No existía** ningún endpoint capaz de cobrar la factura pendiente | backend | ✅ hecho — `POST /billing/pay` |

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
| `src/Api/030_Billing/billing.routes.ts` | la opción activada en las 7 rutas de recuperación; `/cancel` NO; ruta nueva `POST /pay` |
| `src/Api/030_Billing/billing.controllers.ts` | `payOutstanding()` — cobra la factura abierta con la tarjeta predeterminada |
| `src/Utils/ErrorMessages.util.ts` | `Billing.nothingToPay`, `Billing.noDefaultCard`, `Billing.paymentRetryFailed` |
| `src/Utils/SuccessMessage.util.ts` | `Billing.payOutstanding` |

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
