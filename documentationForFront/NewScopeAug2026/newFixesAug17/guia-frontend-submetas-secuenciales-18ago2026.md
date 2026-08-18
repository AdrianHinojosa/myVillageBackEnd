# Guía frontend — submetas secuenciales y nueva regla de promedio

**Fecha:** 18/agosto/2026 · **Origen:** conversación de Lucy (cliente) con Adrian
**Estado del backend:** ✅ implementado, migrado en `development`, 109 aserciones verdes
(`npm run test:subgoals`)

Lucy corrigió **dos reglas** que estaban mal. No es un ajuste cosmético: cambia cómo se calcula el
porcentaje en todo el sistema y cómo se comportan las etapas de una meta dividida.

> **1.** *"Se promedia toda la submeta"* → el % ya no usa los últimos 3 registros, usa **todos**.
> **2.** *"La submeta activa y la meta siempre son el mismo porcentaje. Lo que no quiero es que se
> promedien la submeta 1 y la submeta 2 para que en la meta me dé un 50%, porque no es real."*
> → la meta **no promedia nada**: es igual a la etapa en curso.

---

## 🔴 LA REGLA QUE MANDA: SOLO UNA SUBMETA ACTIVA A LA VEZ

> ### **Una meta dividida tiene, como máximo, UNA submeta con `sStatus = 'ACTIVE'`.**
> ### Nunca dos. Nunca tres. El backend lo garantiza.

Todo lo demás en este documento sale de aquí, así que vale la pena leerlo dos veces:

* **La meta muestra el % de esa única submeta activa.** Si pudiera haber dos activas, la frase "el
  porcentaje de la submeta activa" no tendría una sola respuesta y la regla del cliente sería
  imposible de implementar. Por eso el invariante no es un detalle técnico: **es lo que hace que el
  número de la meta signifique algo.**
* **Solo esa submeta acepta registros.** Capturar en cualquier otra devuelve **409**.
* **Las demás submetas están `PAUSED` (en espera) o cerradas** (`COMPLETED` / `NOT_ACHIEVED`).
* **El frontend no elige cuál es la activa.** La lee: `aSubGoals.find(o => o.sStatus === 'ACTIVE')`.
  No es la tarjeta que el usuario abrió, no es la primera de la lista, no es la última creada.
* **El frontend no puede "activar" dos.** Si manda `PUT { sStatus: 'ACTIVE' }` a una submeta, el
  backend **pausa automáticamente** la que estaba activa. No es un error, es la regla aplicándose:
  activar una es, por definición, desactivar la otra.
* **Al cerrar la activa, el backend activa la siguiente sin cerrar, por orden.** El frontend no tiene
  que mandar un segundo `PUT` para eso — y si lo manda, sobra.

Esto era lo que decía el PDF firmado desde el principio (*"solo una activa a la vez, hay que cerrar
una para avanzar"*). El frontend se construyó con estados independientes y el cliente confirmó que la
versión correcta es la secuencial, así que ese diseño se revierte.

**Cómo se ve en pantalla, siempre:**

```
Meta anual: 20%                     ← igual a la etapa EN CURSO, nunca un promedio
├─ Etapa 1  ✅ Completada    90%     ← historia; su % ya no mueve la meta
├─ Etapa 2  ▶️ En curso      20%     ← LA ÚNICA que acepta registros
└─ Etapa 3  ⏸️ En espera      0%     ← arranca sola cuando se cierre la Etapa 2
```

---

## Lo que ya está bien y NO hay que tocar

Revisé `adrianDev18Aug` (= `origin/dev` 98a9a91). Dos pendientes anteriores ya están resueltos:

| | |
|---|---|
| ✅ Título propio de la submeta | `GoalForm.vue:11-14` ya muestra el input en modo submeta. El backend lo persiste. **Listo.** |
| ✅ Control de estatus de la etapa | `SubGoalsManager.vue:368-393` + `updateStageStatus()` ya hacen `PUT /subGoals/:id { sStatus }`. Es exactamente el mecanismo que la máquina secuencial necesita. **Listo.** |

---

## Resumen de cambios pedidos

| # | Archivo | Cambio | Severidad |
|---|---|---|---|
| 1 | `app/utils/subGoals.ts` | **Borrar `getSubGoalsRollup()`** (o dejarlo solo para el contador N/total). El % de la meta lo manda el API en `oGoal.dProgress`. | 🔴 |
| 2 | `SubGoalsManager.vue:529-536` | `oRollup.dProgress` / `dOverallProgress` → usar `oGoal.dProgress` | 🔴 |
| 3 | `SubGoalsManager.vue` | **"Etapa en curso" ya no es la tarjeta abierta**: es la que tiene `sStatus === 'ACTIVE'`. Solo ahí se puede capturar. | 🔴 |
| 4 | `POST /goals/:id/subGoals` | **No mandar `sStatus`** — el backend lo asigna y lo ignora si se manda | 🟡 |
| 5 | `updateStageStatus()` | Después de cerrar/reabrir, **re-fetch obligatorio**: el backend movió OTRA etapa | 🔴 |
| 6 | UI de etapas | Mostrar la fila como cola: **en curso / en espera / cerrada** | 🟡 |
| 7 | Tarjeta y gráfica | Explicar el **0%** cuando la etapa nueva no tiene capturas, para que no parezca bug | 🟡 |
| 8 | Manejo de errores | Nuevo **409** al capturar en una etapa que no está en curso | 🟡 |
| 9 | `auth.ts`, `admin.vue:339`, `billing/index.vue:86`, `components/billing/*` | **El login ahora devuelve `bIsMainUser`.** Solo el usuario principal del colegio puede administrar tarjetas — esto es el **403** que se estaba viendo en Stripe | 🔴 |

---

## 1 y 2 🔴 — La meta ya no se calcula en el cliente

**Qué hay hoy** — [subGoals.ts:61](../../../../myVillage/app/utils/subGoals.ts) promedia las etapas
iniciadas, y `SubGoalsManager.vue:529-536` lo consume:

```js
oRollup() { return getSubGoalsRollup(this.aSubGoals); },
dOverallProgress() { return this.oRollup.bHasStarted ? this.oRollup.dProgress : 0; },
```

**Por qué ya no sirve:** promediar es justo lo que Lucy pidió que NO se haga. Con Etapa 1 = 80% y
Etapa 2 = 20%, esa función da 50% y el número correcto es 20% (o 80%, según cuál esté en curso).

**Qué hacer:**

```js
// El backend ya guarda el número correcto en la meta. Una sola fuente de verdad.
dOverallProgress() { return Number(this.oGoal.dProgress) || 0; },
```

`getSubGoalsRollup()` puede quedarse **solo** para `iCompleted / iTotal` (el contador "2/3 etapas",
que se usa en las líneas 46 y 266) y para `bAllClosed` (línea 540, `bCanCompleteGoal`). Pero
**quitarle el `dProgress`**, o alguien lo va a volver a usar.

`GET /goals/:id` y `GET /goals/student/:id` ya devuelven el valor agregado en `dProgress`. No hay
campo nuevo ni endpoint nuevo.

---

## 3 🔴 — "La etapa en curso" es un dato del backend, no una selección de UI

**Qué hay hoy:** `oActiveStage` (línea 502) es simplemente la etapa que el usuario abrió con
`openStage()` (línea 693). Cualquier etapa se puede abrir y capturar.

**Por qué ya no sirve:** el backend ahora garantiza que **solo UNA etapa está `ACTIVE`** y la meta
refleja esa. Si el usuario abre la Etapa 3 y captura ahí, el backend responde **409**.

**Qué hacer:** separar los dos conceptos.

```js
computed: {
  // La etapa EN CURSO — dato de negocio. El backend garantiza que hay 0 o 1.
  oCurrentStage() {
    return this.aSubGoals.find(o => o.sStatus === 'ACTIVE') || null;
  },
  // ¿La etapa que el usuario tiene abierta es la que acepta capturas?
  bCanCapture() {
    return !!this.oActiveStage
        && !!this.oCurrentStage
        && this.oActiveStage.sSubGoalId === this.oCurrentStage.sSubGoalId;
  },
},
```

Y en la plantilla, el botón de capturar registro (`v-if="oGoal.sStatus === 'ACTIVE' && oActiveStage
&& oActiveStage.sStatus === 'ACTIVE'"`, línea 358) ya casi lo hace bien: `oActiveStage.sStatus ===
'ACTIVE'` es exactamente la condición correcta. **Solo hay que asegurarse de que `aSubGoals` esté
fresco** después de cualquier cambio de estatus (ver punto 5), porque ese `sStatus` viene de la copia
local.

Abrir una etapa cerrada o en espera para **verla** sigue siendo válido y útil (su historial, su
gráfica). Lo único que no se puede es capturar ahí.

---

## 4 🟡 — No mandar `sStatus` al crear una etapa

Hoy `GoalForm` manda `sStatus: 'ACTIVE'` para toda submeta. Con la máquina secuencial eso pondría
dos etapas en curso, así que el backend **descarta el campo en el POST** y lo asigna él:

| Situación al crear | Estatus que asigna el backend |
|---|---|
| La meta no tiene ninguna etapa en curso | `ACTIVE` — arranca |
| Ya hay una etapa en curso | `PAUSED` — se forma en la cola |

No es un error mandarlo (no da 409), simplemente se ignora. Conviene quitarlo del payload para que el
código diga la verdad.

**En `PUT /subGoals/:id` sí se acepta y sí se usa** — es como se cierra, se pausa o se reabre una
etapa. Eso no cambió.

---

## 5 🔴 — Después de cambiar el estatus, re-fetch obligatorio

Este es el más fácil de pasar por alto. Hoy `updateStageStatus()` (línea 735) hace:

```js
$api.put('/subGoals/' + this.oActiveStage.sSubGoalId, { sStatus, ...oExtra })
  .then(() => {
    this.oActiveStage = { ...this.oActiveStage, sStatus, ...oExtra };  // ⚠️ parche local
    this.fetchSubGoals();
  })
```

**El problema:** un `PUT` a UNA etapa ahora modifica **otras filas**. Cerrar la Etapa 1 hace que el
backend ponga la Etapa 2 en `ACTIVE`, y cambia el `dProgress` de la **meta**. El parche local de la
línea 741 deja la pantalla mintiendo hasta que llegue el `fetchSubGoals()`.

**Qué hacer:** quitar el parche local y refrescar **las etapas y la meta**:

```js
.then(async () => {
  await this.fetchSubGoals();          // el backend ya promovió la siguiente etapa
  this.$emit('goal-updated');          // que el padre vuelva a leer GET /goals/:id
})
```

Lo que el backend mueve solo, en la misma transacción:

| Acción del usuario | Lo que hace el backend además |
|---|---|
| Cerrar la etapa en curso (`COMPLETED` / `NOT_ACHIEVED`) | Pone en `ACTIVE` la siguiente etapa sin cerrar, por orden |
| Poner una etapa en `ACTIVE` (reabrir, o adelantarse) | Pone en `PAUSED` la que estaba en curso |
| Poner la etapa en curso en `PAUSED` | Deja la meta sin etapa en curso |
| Borrar la etapa en curso | Promueve la siguiente sin cerrar |
| Crear la primera etapa | Queda `ACTIVE`, y la meta baja a 0% |

---

## 6 🟡 — Mostrar la fila de etapas como una cola

Con estados independientes daba igual el orden. Ahora la lista **es** una secuencia. Sugerencia de
etiquetas (los estados ya existen, solo hay que nombrarlos bien):

| `sStatus` | Etiqueta | Significado |
|---|---|---|
| `ACTIVE` | **En curso** | La que define el % de la meta. La única que acepta capturas. |
| `PAUSED` | **En espera** | Formada. Arranca sola cuando se cierre la de adelante. |
| `COMPLETED` | **Completada** | Historia. Su % ya no mueve la meta. |
| `NOT_ACHIEVED` | **No alcanzada** | Igual que completada: cerrada. |

El botón de agregar etapa sigue igual (máximo 5) — la nueva se forma al final.

---

## 7 🟡 — El 0% al cerrar una etapa es correcto, hay que explicarlo

Confirmado con el cliente: al cerrar la Etapa 1 en 80%, si la Etapa 2 no tiene capturas la meta
muestra **0%**. Es intencional — la meta dice dónde va el alumno *ahora*, no un promedio del año.

Sin contexto en pantalla eso se ve como un bug. Sugerencia: cuando `oCurrentStage` existe y su
`iRecordsCount === 0`, poner junto al 0% algo como *"Etapa 2 · sin capturas aún"*.

---

## 8 🟡 — Nuevo error a manejar

| Código | Cuándo | Mensaje del backend |
|---|---|---|
| **409** | `POST /trackingRecords` con `sSubGoalId` de una etapa que **no está en curso** | *"Solo se pueden capturar registros en la etapa en curso. Reactiva esta etapa o captura en la etapa activa."* |

Ya existía un 400 genérico (*"la meta no está activa"*) para ese caso; ahora las submetas devuelven
este 409 con un mensaje que dice qué hacer. Los demás códigos no cambian: 409 de validación, 402 por
suspensión, 403 por rol, 404 por id inexistente.

**Editar o borrar** un registro que ya existe en una etapa cerrada **sigue permitido** — es una
corrección, no avance en una etapa terminada.

---

## 9 🔴 — El login ahora devuelve `bIsMainUser` (esto es el 403 de Stripe)

**El problema, en una frase:** el contrato dice que *"únicamente el usuario principal del colegio
tendrá acceso para registrar, modificar o eliminar tarjetas"*, el backend siempre lo ha exigido con un
**403**… y el login nunca decía quién es el usuario principal. Solo mandaba
`sUserType: 'SchoolAdmin' | 'FACULTY' | 'SuperAdmin'`, así que el frontend mostraba la página de
cobranza y todos los botones de tarjeta a **cualquier** SchoolAdmin. Los que no son el principal
chocaban con un 403 sin explicación. **Ese es el 403 que se reportó.**

**Ya está resuelto en backend.** `POST /auth/login` ahora incluye en `results`:

| Campo | Tipo | Valor |
|---|---|---|
| `bIsMainUser` | boolean | `true` solo para la cuenta creada junto con el colegio (`Users.sCreatedBy IS NULL`). Siempre `false` para un SuperAdmin, que no tiene cobranza |

### Qué cambiar

**1. El store** — `app/stores/auth.ts`:

```js
// en el tipo del usuario
bIsMainUser?: boolean;

// getter nuevo, junto a bIsSuperAdmin / bIsSchoolAdmin
bCanManageBilling: (state): boolean =>
  state.oUser?.sUserType === 'SchoolAdmin' && state.oUser?.bIsMainUser === true,
```

**2. El menú** — `app/layouts/admin.vue:339`. Hoy la entrada de cobranza es:

```js
{ sUrl: '/admin/billing', ..., aAllowedUserTypes: ['SchoolAdmin'] },
```

`SchoolAdmin` incluye a los usuarios administrativos secundarios, así que hay que exigir además
`bIsMainUser` (con un `v-if` sobre `bCanManageBilling`, o agregando la condición al filtro que arma
`aMenuItems`).

**3. La página** — `app/pages/admin/billing/index.vue:86`. El `definePageMeta` tiene
`allowedUserTypes: ['SchoolAdmin']` y el comentario ya dice *"Solo el usuario principal del colegio
gestiona la suscripción"* — pero no lo puede cumplir sin este campo. Hay que bloquear la entrada
cuando `bCanManageBilling` sea falso (o redirigir).

**4. Los componentes de tarjeta** — `app/components/billing/`. Ocultar cuando `bIsMainUser` sea falso:

| Componente | Qué ocultar |
|---|---|
| `BillingCardForm` | agregar tarjeta |
| `BillingCardList` | predeterminar y eliminar tarjeta |
| `BillingPlanCard` | cancelar suscripción |

**Las lecturas pueden seguir visibles para cualquier admin del colegio** — el backend las permite:

| Endpoint | Principal | Otro admin | FACULTY | Superadmin | Sin token |
|---|---|---|---|---|---|
| `GET /billing/summary` · `/payments` · `/payment-methods` | **200** | **200** | 403 | 401 | 401 |
| `POST /setup-intent`, `POST/PUT/DELETE payment-methods`, `POST /cancel` | **200** | **403** | 403 | 401 | 401 |

Medido el 18/ago levantando la aplicación real y probando los 8 endpoints con cada tipo de token, no
inferido de la lectura del código.

**El 401 no es un bug:** `/billing/*` son rutas de colegio, así que un token de superadmin de
plataforma no tiene sesión de usuario de colegio. Igual con un header `Authorization` ausente o
vencido. Si se está probando con Postman y un token de admin, 401 es la respuesta correcta.

---

## Efecto de la otra regla: los porcentajes cambian en TODA la app

Esto no requiere cambios de frontend, pero hay que saberlo antes de que alguien reporte un "bug":

* El % ya no es el promedio de los **últimos 3** registros, es el promedio de **todos**.
* Aplica a metas normales **y** a submetas, para que dos metas con los mismos registros no puedan dar
  números distintos.
* Contradice `docs/REGLAS_DE_NEGOCIO.md` §7.4 y §13.2 de este repo, que documentaban los últimos 3
  como decisión del sistema original. **Hay que actualizar ese documento.**
* Consecuencia práctica: un mal arranque ya no se olvida. Una meta que fue 10% → 90% antes mostraba
  90% y ahora muestra el promedio de todo su historial, así que sube más despacio. El escape para un
  día atípico sigue siendo marcar el registro como **excluido**.
* Los valores de `development` ya se recalcularon con la migración `3039`. Ejemplo real: la meta
  "Organización" pasó de 91.67% a 75%.

---

## Lo que NO cambia

* Endpoints, rutas y nombres de campos: **idénticos**.
* `aData` sigue siendo el envelope de `GET /goals/:id/subGoals`.
* Máximo 5 etapas, un solo nivel de anidación, el 409 al capturar en la meta dividida.
* `sMeasurementType` heredado e inmutable.
* Borrar una etapa borra sus registros.
* El reporte del alumno y el PDF: sin cambios respecto a la guía de ayer (siguen recibiendo
  `sSubGoalId` y `sSubGoalTitle` por registro).

---

## Cómo probarlo

Del lado backend está cubierto por `npm run test:subgoals` (109 aserciones). Para probar a mano en
dev, esta secuencia recorre toda la máquina:

1. Crear una meta con "dividir en submetas".
2. Crear 3 etapas → la 1 queda **En curso**, la 2 y la 3 **En espera**. La meta: **0%**.
3. Capturar 3 registros de 9/10 en la Etapa 1 → Etapa 1 **90%**, meta **90%** (no 30%).
4. Intentar capturar en la Etapa 2 → **409**.
5. Cerrar la Etapa 1 → la Etapa 2 pasa a **En curso** sola, y la meta cae a **0%**.
6. Capturar 2 registros de 2/10 en la Etapa 2 → Etapa 2 **20%**, meta **20%** (no 55%).
7. Reabrir la Etapa 1 → la Etapa 2 vuelve a **En espera**, y la meta regresa a **90%**.
8. Cerrar todas → la meta se queda con el % de la **última** etapa cerrada.

---

## 🔴 BLOQUEANTE de build — la cobranza está APAGADA por una variable de entorno

Esto no se arregla con código: **hoy el frontend tiene la cobranza desactivada por bandera**, y ningún
cambio de backend lo enciende.

`nuxt.config.ts:33` define:

```js
billingEnabled: process.env.NUXT_PUBLIC_BILLING_ENABLED === 'true',
```

El `.env` del frontend define **una sola** variable, `NUXT_PUBLIC_API_BASE`. Entonces
`NUXT_PUBLIC_BILLING_ENABLED` está sin definir → `billingEnabled === false` → en
`schools/add.vue:352` y `schools/[id]/edit.vue:352` los campos de tarifa **no se mandan**:

```js
// Cobranza (P3): solo se envía cuando el backend ya la acepta.
if (this.bBillingEnabled) {
  oPayload.sBillingMode = ...; oPayload.dFixedAmount = ...; /* etc. */
}
```

**Consecuencia en cadena:** ningún colegio recibe tarifa → `GET /billing/summary` responde 200 pero
con `sBillingMode: 'FIXED'`, montos en `null`, `dMonthlyTotal: 0` y `sBillingStatus: 'NONE'` → el panel
se ve vacío y **ninguna suscripción puede arrancar**. No es un error del API; es que nunca se
configuró la tarifa.

Y `stripePublishableKey` queda en `''` porque tampoco está ninguna de sus variables, así que
`useStripe()` reporta `bConfigured = false` y el formulario de tarjeta se queda en el placeholder de
"pendiente de configuración" — a propósito, sin truenos, pero sin funcionar.

### Variables que hay que definir al **construir** el frontend

| Variable | Valor | Para qué |
|---|---|---|
| `NUXT_PUBLIC_BILLING_ENABLED` | `true` | enciende el envío de los campos de tarifa. **Sin esto nada de cobranza funciona** |
| `NUXT_PUBLIC_STRIPE_PK_TEST` | la `pk_test_…` de MyVillage | Stripe.js para capturar tarjeta. Está en el `.env` del backend como `STRIPE_PUBLIC_KEY` |
| `NUXT_PUBLIC_STRIPE_MODE` | `test` (default) o `live` | elige entre `..._PK_TEST` y `..._PK_LIVE` |
| `NUXT_PUBLIC_API_BASE` | la URL del API de dev desplegado | hoy el `.env` local dice `http://localhost:3000/development/api/v1/sp` |

`NUXT_PUBLIC_STRIPE_PK` sigue existiendo como override directo si se prefiere una sola variable.

> ### ⚠️ `nuxt.config.ts:7` tiene `ssr: false`
>
> La app es un **SPA estático** (se sube a un bucket de S3). Eso significa que estas variables se
> **congelan en el momento del build**: ponerlas en un servidor después no hace nada, y cambiarlas
> exige **volver a construir y volver a subir**. Es el error clásico de este tipo de despliegue:
> "ya puse la variable" pero el bundle sigue trayendo el valor viejo.
>
> Verificación rápida después de subir: buscar la `pk_test_` dentro de los assets publicados. Si no
> aparece, el build no la tomó.

---

## Aparte — un dato de cuentas que NO es de código

En `development` hay **13 usuarios de colegio con `bPlatformAccess = false`**, y esos **no pueden ni
iniciar sesión**: el login los rechaza con **401** *"bloqueado de la plataforma"*
(`authentication.controllers.ts:41`).

Entre ellos aparece **`lucypotes@hotmail.com` dos veces**: como usuario **principal** de "MV Rosa" y
como **FACULTY** de "Test School Postman2", ambos en `false`. Si Lucy está probando con ese correo, el
401 no viene de cobranza — viene de que la cuenta está sin acceso; y como hay **dos** filas con el
mismo correo, el login toma una de las dos sin que se pueda elegir.

Conviene activar la cuenta correcta y borrar o renombrar la otra. El módulo de cobranza está verde:
`npm run test:stripe`, 183 aserciones.

---

## Pendiente de decidir (no bloquea)

Cuando **todas** las etapas están cerradas, el backend deja la meta con el % de la última etapa
cerrada, pero **no cierra la meta automáticamente**. El front ya tiene `bCanCompleteGoal`
(`SubGoalsManager.vue:540`) para ofrecer el botón. Si el cliente prefiere que la meta se cierre sola,
son ~5 líneas en el backend — pero es una decisión de producto, no técnica.
