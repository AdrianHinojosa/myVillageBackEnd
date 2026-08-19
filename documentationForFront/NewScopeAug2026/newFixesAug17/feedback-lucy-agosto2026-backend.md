# Guía backend / infra — pendientes del feedback de Lucy (agosto 2026)

Todo lo de **frontend** ya está resuelto y en el ambiente de test. Quedan **3 acciones** que
dependen de backend / infraestructura. Cada una incluye el endpoint, el problema y el criterio
de aceptación. Al final hay una nota de algo que **NO es de backend** (para no perseguirlo).

Contexto: las metas pueden dividirse en **submetas** (etapas). Los registros de seguimiento de una
meta dividida se guardan en sus submetas (`/subGoals/:id/trackingRecords`), no en la meta padre.

---

## 1. 🔴 Rollup de progreso — la meta padre no agrega el avance de sus submetas

**Síntoma (Lucy, puntos 4 y 6):** la tarjeta de la meta "anual", el dashboard y el reporte de
progreso salen en **0%** / "no hay metas", aunque las submetas tengan registros.

**Causa:** una meta con `bHasSubGoals = true` no tiene registros propios (viven en las submetas),
así que su `dProgress` es 0. Todas las vistas que leen el progreso propio de la meta muestran 0.

**Cambios solicitados:**

| Endpoint | Qué debe cambiar |
|---|---|
| `GET /goals/:id` y `GET /goals/student/:id` | Para metas con `bHasSubGoals = true`, `dProgress` debe ser el **promedio del `dProgress` de sus submetas iniciadas** (submetas con ≥1 registro), no 0. |
| `GET /students/:id/report` | Debe considerar los **registros de las submetas** para que la meta cuente como "activa con registros" y su progreso no sea 0. |
| `GET /schools/analytics` (`iGoalProgress`) | El promedio de progreso de metas debe usar el `dProgress` ya agregado (con rollup) para metas padre. |

**Criterio de aceptación:** una meta dividida cuyas submetas promedian, p. ej., 76% debe mostrar
**76%** (no 0) en la tarjeta del alumno, en el dashboard y en el reporte.

**Definición de rollup (la que usa el frontend):** promedio del `dProgress` de las submetas con al
menos 1 registro; 0 si ninguna arrancó.

---

## 2. 🔴 Título propio de la submeta no se persiste

**Síntoma (Lucy):** quiere ponerle un **título** a cada submeta (hoy solo dice "Etapa 1") para
llevar el control.

**Causa (probado contra dev):** al crear una submeta enviando `sTitle: "Etapa 1"`, el backend
**guarda el título de la meta padre** e ignora el enviado. Verificado: se envió `"Etapa 1"` y
`GET /goals/:id/subGoals` devuelve el `sTitle` de la meta padre.

**Cambios solicitados:**

| Endpoint | Qué debe cambiar |
|---|---|
| `POST /goals/:id/subGoals` | Aceptar y **persistir el `sTitle`** enviado para la submeta (sin sobrescribirlo con el de la meta padre). |
| `PUT /subGoals/:id` | Permitir **editar** ese `sTitle`. |
| `GET /goals/:id/subGoals` | Devolver el `sTitle` **propio** de cada submeta. |

**Criterio de aceptación:** crear una submeta con `sTitle:"Etapa 1 — Vocales"` y que
`GET /goals/:id/subGoals` devuelva ese mismo texto.

**Nota:** el **frontend ya está listo** — el formulario ya envía `sTitle` y la vista muestra el
título propio (o "Etapa N" como respaldo). En cuanto el backend lo persista, aparece solo, sin
cambios de frontend.

---

## 3. 🌩️ CORS en el bucket de imágenes (logo del colegio en el PDF del IEP)

**Síntoma (Lucy, punto 7):** el logo del colegio no aparece en el PDF del IEP.

**Causa:** el frontend ya usa el logo (`oUser.sSchoolLogo`, el mismo que muestra el menú lateral).
El menú lo muestra con `<img>` (no requiere CORS), pero el PDF debe **rasterizar** la imagen a
base64, y eso requiere **headers CORS** en el bucket que sirve las imágenes
(`myvillagedevelopmentstatic.s3.amazonaws.com`). Hoy el bucket no envía CORS → la conversión falla
→ el logo sale vacío.

**Cambio solicitado (infra/AWS):** agregar configuración **CORS** al bucket de imágenes (dev y prod):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://admin.myvillage.com.mx",
      "https://schools.myvillage.com.mx",
      "http://localhost:3000"
    ],
    "ExposeHeaders": []
  }
]
```

**Alternativa (backend):** que el login / endpoint del colegio devuelva el logo ya como **base64**
(o vía un endpoint del mismo dominio del API); así el frontend no depende de CORS.

**Criterio de aceptación:** exportar un PDF de IEP de un colegio con logo y que el logo aparezca
arriba a la derecha de la primera página.

---

## ✅ NO es de backend — registros de submeta en el PDF (punto 5)

**Síntoma (Lucy):** "el PDF del resumen de la submeta está incompleto, faltan los datos de los registros".

**Verificado contra dev (API) — no perseguir en backend:** se creó una submeta con registros y se
comprobó que **guardan y devuelven TODO correctamente** para todos los tipos de medición
(EXACTITUD, ESCALA, FRECUENCIA, OPORTUNIDAD): fecha, valores y % de avance. Simulando la lógica del
componente, cada fila del PDF sale con su fecha y valor (p. ej. `9 ago 2026 · 9/10 (90%)`). La capa
de datos está **completa**; no hay bug de backend. Si el PDF aún se ve vacío, se necesita el **PDF
exacto** que exporta Lucy para revisar un posible detalle visual de render (frontend), o suele ser
un PDF exportado antes de capturar registros.
