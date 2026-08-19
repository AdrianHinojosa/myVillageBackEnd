# Plan de implementación — Ampliación de alcance MY VILLAGE (cerrada 24/jul/2026, v1.0.0)

> Fuente: `My Village_ Ampliación de alcance -  Cerrado 24_Julio_2026.pdf`
> Total: **$131,850 MXN + IVA** · Plazo: **4 semanas laborales** · Pago: 100% por adelantado.
> Este plan está aterrizado sobre el código real del frontend (mapeo 24/jul/2026). Backend en repo aparte (`myVillageBackEnd`).

## Leyenda de dependencia de backend
- 🔴 **Crítico** — sin backend no funciona (no se puede simular con dummy más allá de la UI).
- 🟡 **Ligero** — un campo/flag o un endpoint; el front avanza en paralelo con dummy.
- 🟢 **Ninguno** — puro frontend.

| # | Punto | Precio | Backend |
|---|---|---|---|
| 3 | Cobranza automática (Stripe) | $70,000 | 🔴 Crítico |
| 7 | Metas con submetas | $24,000 | 🔴 Crítico |
| 5 | Modo Terapeuta | $14,000 | 🟡 Ligero (flag) |
| 8 | Tipos de ayuda | $14,000 | 🟡 Ligero (2 campos) |
| 10 | Tickets de soporte | $8,000 | 🟡 Ligero (1 endpoint email) |
| 11 | Guía de creación de metas | $5,500 | 🟢 Ninguno |
| 13 | Módulo de capacitaciones | $11,000* | 🟢 Ninguno* |

\*Punto 13 sujeto a modificación de precio; "ninguno" válido solo si los videos se embeben (YouTube/Vimeo) o son assets en `public/`. Ver gap G15.

---

## Contexto de arquitectura (hallazgos del mapeo)
- **No hay store de metas ni de colegios.** Todo el CRUD de goals/records/schools es inline con `$api` dentro de las páginas. Stores existentes: `auth`, `alert`, `navigation`, `filters`.
- **Tipos de usuario:** `SuperAdmin`, `SchoolAdmin`, `FACULTY` (`app/stores/auth.ts:14`, `app/middleware/auth.global.ts:47`). ⚠️ El form de creación de usuarios usa la etiqueta `ADMINISTRATION` en vez de `SchoolAdmin` (`UserForm.vue:129-133`) — reconciliar al gatear.
- **Colegio ya tiene** `iUsersLimit`, `iStudentsLimit`, `bBlocked` (único estado), y "usuario principal" = `oSchool.SchoolUser[0]`.
- **Middleware global** (`auth.global.ts`) gatea `/admin/*` por `requiresAuth` + `allowedUserTypes` + `module/action` (`hasPermission`). Es el punto para la suspensión por falta de pago.
- **i18n bilingüe ES+EN** ya completo (871 claves alineadas). Todo lo nuevo debe salir bilingüe en `i18n/locales/{es,en}.json`. Usar `$t()` / `useI18n()` desde el inicio.
- **Estándares:** notación húngara, `.then/.catch/.finally` (NUNCA async/await + try/catch), naming `getX/createX/...` (API) `fetchX/saveX/removeX` (store) `executeX/handleX` (componentes).
- **Assets estáticos:** `public/images/...` referenciados por ruta root-relative (`/images/...`).

---

## Punto 3 — Cobranza automática 🔴 ($70,000)

**Resumen:** módulo de suscripciones mensuales de colegios vía **Stripe** (tokenización, suscripciones, webhooks). Dos modalidades **alternativas y NO acumulables** (el cliente elige UNA — ver gap G3). Sin CFDI (propuesta aparte).

### Backend (crítico — camino crítico del proyecto)
- Integración Stripe: customers, payment methods, subscriptions, webhooks de confirmación.
- Cobro recurrente mensual (scheduler/cron) usando el método configurado.
- Historial de pagos: monto, fecha, método, `id` de transacción Stripe.
- Pagos fallidos: hasta **2 reintentos** adicionales; si fallan → marcar colegio **moroso** + email al usuario principal.
- Suspensión: al marcar moroso → suspender de inmediato (sin gracia); reactivar al cobrar OK. Conservar info (sin borrado automático).
- Cancelación: el usuario principal cancela; activo hasta fecha de corte, luego se suspenden cobros. Sin reembolsos parciales.
- **Modalidad tarifa fija:** monto mensual único por colegio (ej. $10,000) + % descuento opcional. Cambios aplican al **siguiente** ciclo.
- **Modalidad tarifa variable:** monto por maestro + monto por alumno; total = usar **límite máximo** (`iUsersLimit`/`iStudentsLimit`), NO el conteo real, para evitar manipulación. + % descuento. Cambios de límite aplican al siguiente ciclo (sin prorrateo).

### Frontend
1. **Config de tarifa (superadmin):** nueva sección en `app/pages/admin/schools/[id]/edit.vue` (después de "Límites", líneas 63-87) + card en detalle `[id]/index.vue`. Campos según modalidad: `sBillingType`('FIXED'|'VARIABLE'), `dFixedAmount`, `dAmountPerTeacher`, `dAmountPerStudent`, `dDiscountPct`. Reusar `FormsCurrencyField`. Añadir al `oForm`/PUT payload (`edit.vue:220-225`).
2. **Gestión de tarjetas (usuario principal del colegio):** nueva vista en panel de colegio. Registrar/editar/eliminar tarjetas (Stripe.js / Elements para tokenización client-side), marcar predeterminada. Solo visible para el usuario principal.
3. **Historial de pagos:** vista con `DataTable` (monto/fecha/método/id Stripe).
4. **Cancelación de suscripción:** acción en panel de colegio (confirm dialog).
5. **Suspensión (gate):** en `auth.global.ts` tras el check de auth (~línea 44/53), leer estado de cuenta del colegio (extender `bBlocked` o nuevo `sAccountStatus`) desde `authStore.oUser.oSchool` y redirigir a una página "cuenta suspendida". Incluir el flag en el payload de `/auth/login` → `IUser` (`login.vue:102-105`, `auth.ts:9-19`).
6. Dependencia nueva: `@stripe/stripe-js`. i18n ES+EN de todo el módulo.

### Gaps: G3 (¿cuál modalidad?), G4 (Stripe keys/moneda), G5 (usuario principal = SchoolAdmin?), G6 (límites ya existen ✅).

---

## Punto 7 — Metas con submetas 🔴 ($24,000)

**Resumen:** dividir una meta en hasta **5 submetas** (1 nivel, sin anidar). **Cada submeta se comporta como una meta completa** (config, registros, estado y gráfica propios); la meta principal es el contenedor "anual" y muestra un **rollup**. Las metas sin división siguen igual.

### Decisiones (PO) — cerradas
- Submetas con **CRUD normal**: crear al crear la meta **y también después**, editar y eliminar. **No** reordenar.
- Límite **5** (constante configurable).
- **Sin máquina secuencial:** cada submeta con su estado propio (activa/completada/no alcanzada/pausada), **activa por default**. NO "una sola activa" ni "cerrar para avanzar". ⚠️ *Se desvía de la cotización (que pedía secuencial) — decisión del PO.*
- **Registros → submeta**; la meta principal no tiene registros propios cuando está dividida.
- **Tipo de medición se hereda** de la meta principal (inmutable en submetas).
- **Avance de la meta principal** = dos indicadores: (a) **progreso = promedio SOLO de las submetas ya iniciadas** (con ≥1 registro; las vacías no cuentan, para no dar falso negativo) y (b) **"N/total etapas completadas"**. Se **completa cuando TODAS las submetas están cerradas**.
- **Tipo de ayuda (P8)** aplica por submeta (ya implementado en el registro).

### Frontend
1. **Pregunta al crear:** sección final "¿Deseas dividir esta meta en submetas?" (Sí/No) en `GoalForm.vue` (entre Documentos y las acciones). Si Sí → tras crear la meta, entrar a la gestión de submetas.
2. **Gestión de submetas (CRUD):** UI para crear/editar/eliminar hasta 5 submetas (heredan `sTitle` + tipo de medición), reusando los campos por tipo de `GoalForm`. Cada submeta tiene su estado propio.
3. **Visualización:** en el detalle de la meta principal, desglosar las submetas (lista con progreso/estado de cada una) + el rollup (promedio + etapas completadas). Cada submeta abre su propio detalle (config + registros + gráfica), reusando `GoalDetail`/`GoalSummary`.
4. **Registros:** con submetas, `RecordForm` liga el registro a la submeta (`sSubGoalId`); la captura ocurre dentro del detalle de la submeta.
5. **Rollup:** helper que promedia el progreso de las submetas (reusar `getProgressDisplay`/`getRecordPercentage` por submeta).
6. **Probable primer store de metas** (`app/stores/goals.ts`) para la relación meta↔submetas.

### Backend
Contrato en `docs/addons-julio2026/GUIA_BACKEND_AMPLIACION.md` (tabla `SubGoals` + FK `sSubGoalId` en registros + campos calculados + rollup).

### Gaps: **RESUELTOS** (ver Decisiones arriba).

---

## Punto 5 — Modo Terapeuta 🟡 ($14,000)

**Resumen:** modalidad donde terminología y comportamientos se adaptan a terapeutas. "colegio"→"terapeuta"; "alumnos"→"alumnos / pacientes"; quitar textos de gestión escolar; terapeuta = **usuario único** (no crea usuarios); sin cargar documentos ni módulo IEP.

### Backend (ligero)
- Flag/tipo de cuenta (ej. `bIsTherapist` o `sAccountType:'SCHOOL'|'THERAPIST'`) en el colegio/cuenta.
- Forzar "usuario único" (no permitir crear usuarios adicionales).
- Incluir el flag en el payload de `/auth/login`.

### Frontend
1. **Terminología:** swap condicional de namespaces i18n (`schools`→`therapists`, `students`→`patients`, `modules.schools`/`modules.students`) según el flag. Los textos están centralizados en `es.json`/`en.json` (`schools.*` 154-227, `modules.*` 74-84), no hardcodeados — se puede resolver con un computed que elija la variante. Precedente: `privacy-notice.vue` ya usa "alumnos y pacientes".
2. **Ocultar IEP:** IEP es un **tab del detalle de alumno** (`students/[id]/index.vue:257`, `VALID_TABS:216`), no un módulo del sidebar. Excluir el tab condicionalmente.
3. **Ocultar carga de documentos:** gatear la sección "Documentos" de `GoalForm.vue:305-372` con el flag.
4. **Usuario único:** ocultar creación de usuarios en modo terapeuta (sidebar item Users + `users/add.vue`).
5. **Etiqueta de cuenta:** el bloque indicador de colegio (`admin.vue:32-51`, `oUser.sSchoolName/sSchoolLogo`) muestra "terapeuta".
6. i18n ES+EN de todas las variantes.

### Gaps: G7 (¿cómo nace la cuenta terapeuta? tipo en signup vs flag), G8 (¿paga vía Punto 3? ¿qué tarifa?).

---

## Punto 8 — Tipos de ayuda 🟡 ($14,000)

**Resumen:** documentar el "tipo de ayuda" en cada registro de seguimiento, SIN afectar resultado ni cálculos. Tipos: independiente, ayuda general, visual, verbal, escrita, gestual, modelación, física. En la gráfica: color por tipo + número (cantidad) + leyenda.

### Backend (ligero)
- 2 campos nuevos en el registro: `sHelpType` (enum de 8) + `iHelpAmount` (cantidad). Persistir; NO tocan cálculos (carácter documental, como una nota).

### Frontend
1. **Captura:** en `RecordForm.vue` (`oFormData` `:312-327`) agregar select `sHelpType` (lista predefinida) + `NumberField` `iHelpAmount`. Nada cambia al crear la meta. Mapear en `app/utils/records.ts` (`mapRecordFromBackend`/`mapRecordToBackend`).
2. **Gráfica:** en `GoalSummary.vue` (`aChartJsDatasets` `:382-404`) pasar array de colores por punto según `sHelpType` y el número por punto (cantidad).
3. **BaseLineChart:** `formatDatasets()` (`:166-182`) — `pointBackgroundColor` acepta **array** (`:178`); número por punto requiere plugin datalabels o label plugin custom (registrar cerca de `:33-42`).
4. **Leyenda:** activar `bShowLegend` (hoy `false` en `GoalSummary.vue:156`) o leyenda HTML custom junto al chart (`:144-159`). Caja fija color↔tipo.
5. Definir 8 colores (paleta de marca) + claves i18n ES+EN de los tipos.
6. Opcional: reflejar en PDF (`useGoalChartCapture.ts:150,208-219`) si se requiere en export.

### Gaps: G12 (¿un solo tipo de ayuda por registro? — el doc implica que sí).

---

## Punto 10 — Tickets de soporte 🟡 ($8,000)

**Resumen:** formulario para levantar tickets; al enviar, email automático a **info@myvillage.com.mx**. Ubicación: sección superior derecha (junto a cuenta / T&C / Aviso de Privacidad). Sin panel interno ni seguimiento (propuesta aparte).

### Backend (ligero)
- **Endpoint nuevo `POST /support/ticket`** que envía el correo. ⚠️ Confirmado: el frontend NO tiene ningún mecanismo de email (solo un `mailto:` estático en `privacy-notice.vue:86`).

### Frontend
1. **Botón:** en el appbar `app/layouts/admin.vue`, entre el spacer (`:160`) y el `CoreLanguageSwitcher` (`:163`) — o como item nuevo en `aUserMenuItems` (`:370-400`). Recomendado: botón dedicado junto al language switcher.
2. **Modal:** `UModal` (copiar patrón de `dialogs/Confirm.vue`) con `FormsTextField` (asunto) + `FormsTextArea` (descripción) + opcional `FormsSelectField` (categoría) + opcional `FormsFileUpload` (adjunto).
3. **Envío:** `$api.post('/support/ticket', {...}).then().catch().finally()`; el interceptor de axios ya alerta éxito/error automáticamente.
4. i18n ES+EN.

### Gaps: G13 (¿qué campos lleva el formulario?).

---

## Punto 11 — Constructor de creación de metas 🟢 ($5,500)

**Cambio de alcance aprobado por el PO (24/jul):** en vez de la **imagen estática** cotizada, se implementa un **constructor guiado programado (HTML)** — más dinámico y de más valor por esfuerzo similar, sin cambiar backend. La descripción se compone por 8 segmentos de color (Estudiante · Tiempo · Acción · Línea base · Criterio de logro · Contexto · Apoyo · Seguimiento) con leyenda/guía arriba (referencia: screenshot "Una meta clara responde").

**Invariante:** la salida es **una sola oración concatenada** que se guarda en el mismo campo `sDescription`. Cero endpoint/campo nuevo. Modo "Texto libre" para editar metas existentes.

### Frontend (cero backend)
Ver plan de ejecución detallado y checklist en **`docs/addons-julio2026/EJECUCION_FRONTEND_AMPLIACION.md`**. Resumen:
1. `app/utils/goalDescriptionSegments.ts` (config de 8 segmentos, solo claves i18n + tokens de color).
2. `app/components/goals/GoalDescriptionBuilder.vue` (composer inline + leyenda + toggle Guiado/Libre; `v-model`→`sDescription`).
3. Tokens `--seg-*` en `main.css` (light+dark).
4. Integrar en `GoalForm.vue:17-22` (reemplaza el `FormsTextArea` de descripción).
5. i18n `goals.builder.*` en `es.json` + `en.json`.

Prototipo interactivo aprobado: `scratchpad/goal-builder-proto.html`.

### Gaps: obligatoriedad de segmentos (¿Acción+Estudiante obligatorios?) · confirmar bilingüe.

---

## Punto 13 — Módulo de capacitaciones 🟢 ($11,000, sujeto a modificación)

**Resumen:** vista nueva "Capacitaciones": videos organizados en carpetas + buscador. Carga estática (modificar solo desde código front). Contempla desarrollo del módulo + carga y visualización.

### Frontend
1. **Página:** `app/pages/admin/capacitaciones/index.vue` con `definePageMeta({ layout:'admin', crumb:'crumbs.capacitaciones', allowedUserTypes:[...], module:'Trainings' })`. ⚠️ SÍ poner `allowedUserTypes`/`module` (las páginas superadmin actuales no gatean por ruta — solo por sidebar).
2. **Sidebar:** entrada en `aNavItems()` (`admin.vue:290-321`) con `sModule:'Trainings'` + `aAllowedUserTypes`.
3. **UI:** `ListFilters` (buscador) + grid de `core/cards/Card.vue` (carpetas/videos) + `EmptyState`/`Loading`. Búsqueda sobre lista hardcodeada.
4. i18n: `modules.capacitaciones` + `crumbs.capacitaciones` en ES y EN.

### Gaps: G15 (¿dónde viven los videos? embed vs S3 vs public/), G16 (¿quién ve la vista? gating).

---

## Anotaciones generales del contrato
- SOFEX no se responsabiliza por cambios en APIs/plataformas externas; el cliente provee los web services necesarios en el formato especificado.

## Detalles menores a confirmar
- G17: la firma dice "24 de julio del **2025**" (parece typo, debería 2026).
- G18: condiciones de pago dicen "Anticipo 50% / Finiquito 50%" y luego "100% previo al inicio" — para esta ampliación manda 100% por adelantado.

---

## Secuencia sugerida (4 semanas)
1. **Arranque temprano del backend crítico:** Stripe (P3) y esquema de submetas (P7) — son el camino crítico.
2. **En paralelo, frontend sin bloqueo:** P11 (guía) y P13 (capacitaciones) — empezables hoy, cero backend.
3. **Backend chico + su front:** P5 (flag terapeuta), P8 (2 campos), P10 (endpoint email) — front avanza con dummy mientras el endpoint/campo se agrega.
4. **Integración final:** conectar P3 y P7 a sus contratos de API; QA bilingüe (ES+EN) de todo.

## Gaps abiertos (pendientes de respuesta del cliente / decisión)
| ID | Punto | Pregunta |
|---|---|---|
| G1 | Todos | ¿Backend lo hacemos nosotros (`myVillageBackEnd`) o va con otro equipo? |
| G2 | Todos | ¿Todo lo nuevo bilingüe ES+EN (incluida la imagen del P11)? |
| G3 | 3 | ¿Modalidad fija o variable? (solo la variable trae precio) |
| G4 | 3 | ¿Cuenta Stripe / llaves / moneda MXN? |
| G5 | 3 | ¿"Usuario principal del colegio" = SchoolAdmin? |
| G6 | 3 | Límites de maestros/alumnos ya existen (`iUsersLimit`/`iStudentsLimit`) ✅ |
| G7 | 5 | ¿Cómo nace una cuenta terapeuta? (tipo en signup vs flag) |
| G8 | 5 | ¿El terapeuta paga vía P3? ¿con qué tarifa? |
| G9 | 7 | ¿Progreso de meta principal = submeta activa? |
| G10 | 7 | ¿Registros sobre la submeta activa? |
| G11 | 7 | ¿Orden de submetas fijo/secuencial? |
| G12 | 8 | ¿Un solo tipo de ayuda por registro? |
| G13 | 10 | ¿Qué campos lleva el formulario de ticket? |
| G14 | 11 | ¿Asset final + versión EN? ¿inline o popover? |
| G15 | 13 | ¿Dónde viven los videos? (embed / S3 / public) |
| G16 | 13 | ¿Quién ve Capacitaciones? gating |
| G17 | — | Firma "2025" (¿typo por 2026?) |
| G18 | — | Pago: 100% por adelantado gobierna esta ampliación |
