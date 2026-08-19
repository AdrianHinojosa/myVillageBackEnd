# Respuesta backend — feedback de Lucy (17/agosto/2026)

Responde punto por punto a [`feedback-lucy-agosto2026-backend.md`](feedback-lucy-agosto2026-backend.md).

| # | Tema | Estado |
|---|---|---|
| 1 | Rollup de progreso de la meta padre | ✅ **Hecho y probado** — incluye recálculo de las metas que ya existían |
| 2 | Título propio de la submeta | ✅ **Hecho y probado** |
| 3 | CORS del bucket de imágenes | 🟡 **Listo para aplicar** — instrucciones exactas abajo; lo aplica MyVillage en la consola de AWS |
| 5 | Registros de submeta en el PDF | ✅ **De acuerdo, no es backend** — y el reporte ahora manda datos extra que ayudan |
| — | Endpoints de Stripe dando 401/403/404 | ✅ **Explicado abajo** — no hay bug: el código no está desplegado en dev |

Pruebas re-ejecutables: `npm run test:subgoals` → **66 aserciones, 0 fallos**.

---

> ## ⚠️ AVISO — 18/agosto/2026
>
> Lucy corrigió la regla del punto 1 al día siguiente: la meta **no promedia** sus submetas, la meta
> **es** el porcentaje de la submeta activa. Y el porcentaje de cada submeta ahora promedia **todos**
> sus registros, no los últimos 3.
>
> **Lo que está implementado hoy es la regla nueva.** Todo lo que dice esta sección 1 sobre "promedio
> de TODAS las submetas" quedó superado — se conserva solo para que el cambio sea trazable.
>
> 👉 Regla vigente y cambios de frontend:
> [`guia-frontend-submetas-secuenciales-18ago2026.md`](guia-frontend-submetas-secuenciales-18ago2026.md)
>
> Las secciones **2 (título)**, **3 (CORS)**, **5 (PDF)** y la de **Stripe 401/403/404** siguen
> vigentes tal cual.

## 1. ⚠️ Rollup de progreso — resuelto, pero la regla cambió el 18/ago

### Qué se hizo

El progreso de la meta padre ya **no se calcula al leer**: se **guarda** en la propia meta
(`Goals.dProgress`, `dAverageValue`, `iRecordsCount`, `tLastRecord`) y se recalcula solo cada vez que
algo puede cambiarlo:

* al **capturar**, editar, excluir o borrar un registro de una submeta,
* al **crear** una submeta (una etapa vacía baja el promedio: cuenta como 0),
* al **borrar** una submeta,
* y una sola vez para lo histórico, con la migración `3038_Goals_backfillSubGoalRollup`.

Se hizo así a propósito: los tres lugares del feedback (tarjeta, dashboard, reporte) y también
`/schools/analytics` leen esa columna. Arreglarla en el origen los arregla todos a la vez, sin
recalcular en cada request y sin repetir la regla en cuatro endpoints.

| Endpoint | Resultado |
|---|---|
| `GET /goals/:id` | `dProgress` ya trae el rollup — sin cambios de contrato |
| `GET /goals/student/:id` | igual, y las submetas siguen sin aparecer como metas |
| `GET /students/:id/report` | ✅ arreglado — ver abajo |
| `GET /schools/analytics` (`iGoalProgress`) | ✅ automático: promedia `dProgress` excluyendo submetas (`sParentGoalId IS NULL`), y ese `dProgress` ya es el agregado |

**El reporte estaba peor de lo reportado.** Buscaba los registros con
`whereIn('sGoalId', <ids de metas de primer nivel>)`. Los registros de una submeta llevan el id de la
**submeta**, así que no encontraba ninguno — y como el reporte se queda solo con las metas que
tienen registros, la meta dividida **no salía en 0%: desaparecía del reporte**. Ahora también
consulta los ids de las submetas y **atribuye cada registro a su meta padre**.

### ⚠️ Diferencia de regla que hay que cerrar

El documento de feedback define el rollup como *"promedio del `dProgress` de las submetas con al
menos 1 registro"*. La decisión del PO del **14/agosto/2026** fue distinta:

> **Promedio de TODAS las submetas activas. Una submeta sin registros cuenta como 0, no se omite.**

Eso es lo que está implementado, porque fue la decisión explícita del dueño del producto.

Con datos reales de dev **las dos reglas dan el mismo número** (las 3 metas divididas que existen
tienen todas sus etapas con registros: 91.67%, 70.37% y 46.67%). Solo difieren cuando una etapa está
vacía:

| Caso | Regla PO (implementada) | Regla del frontend |
|---|---|---|
| Etapa 1 = 90%, Etapa 2 sin registros | **45%** | 90% |
| Etapa 1 = 90%, Etapa 2 = 60% | 75% | 75% |

**Mientras el frontend no se alinee**, `getSubGoalsRollup()` en `app/utils/subGoals.ts` mostrará un
porcentaje distinto al de la tarjeta cuando alguna etapa esté vacía. Registrado en
[`frontEndChanges.md`](../frontEndChanges.md).

*Argumento a favor de la regla del PO:* una meta anual dividida en 4 etapas, con solo la primera
trabajada al 100%, no está al 100% — está al 25%. Promediar solo las iniciadas hace que el avance
**baje** al empezar una etapa nueva, que es justo cuando el alumno avanzó.
*Si prefieren la otra regla*, el cambio es una línea (`recalculateParentRollup`, filtrar por
`iRecordsCount > 0`) más volver a correr la migración de backfill. Díganlo y se hace.

### Metas que ya existían

La migración `3038_Goals_backfillSubGoalRollup` recalcula de una vez todas las metas divididas
anteriores. **Ya se aplicó en `development`**, con este resultado:

```
Organización                  0.00% → 91.67%   (10 registros)
MEjorar lectura comprehensiva 0.00% → 70.37%   ( 4 registros)
Lectura comprensiva           0.00% → 46.67%   ( 3 registros)
```

Es idempotente (correrla dos veces da lo mismo) y no borra nada. En producción se aplica sola en el
despliegue.

### Datos nuevos en el reporte

Cada registro de `GET /students/:id/report` ahora trae, además de lo de siempre:

| Campo | Valor |
|---|---|
| `sSubGoalId` | id de la etapa que lo generó, o `null` si la meta no está dividida |
| `sSubGoalTitle` | título de esa etapa, o `null` |

`sGoalId` **sigue apuntando al dueño real de la fila** (la submeta): agrupar por meta padre se hace
en la respuesta, no falseando el campo. El frontend no necesita cambiar nada — usa `aRecords` tal
cual —, pero con esos dos campos el PDF puede etiquetar cada renglón con su etapa si se quiere.

---

## 2. ✅ Título propio de la submeta — resuelto

`POST /goals/:id/subGoals` y `PUT /subGoals/:id` ahora **aceptan y guardan** `sTitle`, y
`GET /goals/:id/subGoals` devuelve el título propio de cada submeta.

Criterio de aceptación probado tal cual: crear con `sTitle: "Etapa 1 — Vocales"` → el GET devuelve
`"Etapa 1 — Vocales"`.

Dos reglas de compatibilidad, porque el `GoalForm.vue` desplegado hoy **oculta el input de título en
modo submeta y aun así manda `sTitle: ''`**:

* `sTitle` **vacío o ausente al crear** → hereda el título de la meta padre (comportamiento actual,
  nada se rompe).
* `sTitle` **vacío al editar** → **no borra** el título guardado, lo deja como está.

Solo un título con contenido real reemplaza al anterior. `sMeasurementType` sigue heredado e
inmutable: todas las etapas de una meta miden lo mismo.

**Nota:** el feedback dice que el frontend ya está listo. En `origin/dev` (`GoalForm.vue:9`) el input
sigue detrás de `v-if="!bIsSubGoal"`. Si el formulario que ya se probó es otro, ignoren esta nota;
si no, hay que quitar esa condición para poder escribir el título. El backend funciona en ambos
casos.

---

## 3. 🌩️ CORS — qué hacer exactamente en la consola de AWS

### Lo que se encontró (verificado con la API de S3, 17/ago/2026)

| Bucket | Para qué | CORS hoy |
|---|---|---|
| `myvillagedevelopment` | **el que sirve el logo en dev** (`AWS_BUCKET_NAME` del backend) | ⚠️ Existe, pero solo permite `https://schools.myvillage.com.mx` y `http://localhost:3000` |
| `myvillagedevelopmentstatic` | el que menciona el feedback | ❌ **Sin ninguna configuración de CORS** |
| `myvillageproduction` | el que servirá el logo en producción | ❌ **Sin ninguna configuración de CORS** — el mismo bug va a aparecer en producción |

Dos motivos por los que hoy falla, además del bucket sin CORS:

1. **El origen desplegado no está en la lista.** El sitio corre en
   `http://admin.myvillage.com.mx.s3-website-us-east-1.amazonaws.com`, que no aparece.
2. **CORS compara el esquema exacto.** `http://…` y `https://…` son orígenes **distintos**: aunque
   estuviera el dominio, con el esquema equivocado el navegador igual bloquea.

El logo viaja en una **URL prefirmada** de S3 (`Storage.services.ts`), así que basta con GET/HEAD.

### Pasos en la consola

Hacerlo en **los tres** buckets: `myvillagedevelopment`, `myvillagedevelopmentstatic` y
`myvillageproduction`.

1. Consola de AWS → **S3** → clic en el bucket.
2. Pestaña **Permissions** (Permisos).
3. Bajar hasta **Cross-origin resource sharing (CORS)** → **Edit**.
4. Pegar el JSON de abajo **reemplazando** lo que haya.
5. **Save changes**. Aplica en segundos; en el navegador conviene recargar con caché limpia.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://admin.myvillage.com.mx",
      "https://schools.myvillage.com.mx",
      "https://development.admin.myvillage.com.mx",
      "https://development.schools.myvillage.com.mx",
      "http://admin.myvillage.com.mx.s3-website-us-east-1.amazonaws.com",
      "http://schools.myvillage.com.mx.s3-website-us-east-1.amazonaws.com",
      "http://development.admin.myvillage.com.mx.s3-website-us-east-1.amazonaws.com",
      "http://development.schools.myvillage.com.mx.s3-website-us-east-1.amazonaws.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Incluye los cuatro endpoints de sitio web de S3 (`http://`, que es lo único que sirven esos
endpoints) y los cuatro dominios propios (`https://`, para cuando se entre por el dominio). Sobra
alguno hoy, pero ninguno abre nada: son solo lectura de imágenes desde orígenes de MyVillage.

**Verificación:** exportar el PDF del IEP de un colegio con logo y ver el logo arriba a la derecha de
la primera página. Si aún falla, la consola del navegador dirá qué host bloqueó y ese host es el
bucket al que le falta la regla.

**Alternativa que evita CORS para siempre** (si prefieren no depender de esto): que el backend
devuelva el logo ya en base64 desde un endpoint propio del API. Es más trabajo y agrega peso al
login, así que la recomendación es CORS; si lo quieren, se hace.

---

## 5. ✅ Registros de submeta en el PDF — coincidimos, no es backend

Verificado otra vez desde el API: los registros de submeta se guardan y se devuelven completos para
todos los tipos de medición. Y ahora el reporte manda además `sSubGoalId` y `sSubGoalTitle` por
registro, así que si el PDF los quiere mostrar agrupados por etapa, los datos ya están.

---

## Endpoints de Stripe: 401 / 403 / 404 — por qué

**No hay bug.** Los 8 endpoints están verdes en la suite `npm run test:stripe` (**183 aserciones**,
contra el Stripe real en modo test). Cada código tiene una causa concreta:

### 404 — la causa principal: el código no está desplegado

Todo el módulo de cobranza vive en la rama `features02Aug2026`, que está **21 commits adelante de
`main`** y **nunca se ha mergeado ni desplegado**. `main` no tiene siquiera la carpeta
`src/Api/030_Billing/`. Un endpoint que no existe en el servidor responde 404 — que es exactamente
lo que se está viendo.

Encaja con el resto del feedback: las submetas **sí** responden en dev (se probaron), y las submetas
entraron **antes** que la cobranza en la misma rama. Es decir, el servidor de dev corre un build
intermedio: tiene P7, no tiene P3.

**Qué hacer:** desplegar `features02Aug2026` en `/development`. Es la única acción necesaria para los
404.

### 401 — token que no es de un usuario de colegio

`/billing/*` son rutas **de colegio**. El middleware busca una sesión de usuario de colegio; con un
token de **superadmin de plataforma** no la encuentra y responde `401`. Si se probó desde el panel de
admin de MyVillage (o con un token viejo/expirado), 401 es la respuesta correcta.

También da 401 si falta el header `Authorization: Bearer <token>`.

### 403 — el rol no puede tocar cobranza

Por contrato: *"Únicamente el usuario principal del colegio tendrá acceso para registrar, modificar o
eliminar tarjetas."*

| Quién | `GET /billing/summary`, `/payments`, `/payment-methods` | `POST`/`PUT`/`DELETE` de tarjetas y `/cancel` |
|---|---|---|
| Usuario **principal** del colegio (`Users.sCreatedBy IS NULL`) | ✅ | ✅ |
| Otro usuario administrativo del colegio | ✅ | ❌ **403** |
| Usuario **FACULTY** (maestro) | ❌ **403** | ❌ **403** |
| Superadmin de plataforma | ❌ 401 (no es sesión de colegio) | ❌ 401 |

Revisado en la base de dev: **los 11 colegios activos tienen exactamente un usuario principal**, así
que entrando con ese usuario los 403 desaparecen.

### Otros códigos posibles (para no confundirlos con un error)

| Código | Significado |
|---|---|
| `402` | El colegio está `SUSPENDED` por falta de pago — bloquea **toda** la plataforma, no solo cobranza |
| `503` | No hay llaves de Stripe configuradas en ese ambiente (`STRIPE_PRIVATE_KEY`) |
| `409` | Validación (en este proyecto los errores de validación salen 409, no 400) |

### Pendiente de infraestructura para Stripe

1. **Desplegar** `features02Aug2026` en `/development` ← desbloquea los 404.
2. Crear el **webhook** en el dashboard de Stripe y poner `STRIPE_WEBHOOK_SECRET` en el `.env` del
   servidor. Sin él, los cambios de estado de la suscripción (pago exitoso, pago fallido, suspensión)
   no llegan solos.
3. Dar al frontend la llave publicable `NUXT_PUBLIC_STRIPE_PK` (sin ella la UI de tarjetas queda en
   "pendiente de configuración" a propósito, no truena).

---

## Cómo comprobar todo esto

```bash
npm run test:subgoals    # 66 aserciones — rollup, título propio y reporte
npm run test:stripe      # 183 aserciones — los 8 endpoints de cobranza + webhooks
```

Las dos suites se niegan a correr si la base no es `development` y borran todo lo que crean.
