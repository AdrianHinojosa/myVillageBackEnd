# Guía unificada para backend — Ampliación de alcance (24/jul/2026)

> Documento maestro front↔back. Reúne, en un solo lugar, todo lo que el backend
> (`myVillageBackEnd`) debe implementar para los puntos de la ampliación que dependen
> de él. Las instrucciones están **aterrizadas a los patrones reales del backend**
> (ver `.claude/skills/SKILL.md` en ese repo). Los puntos 11 y 13 son 100% frontend.

---

## Patrones del backend (cómo se hacen las cosas aquí)

Stack: **Express + `express-async-handler` (aH) + `celebrate`/Joi + Knex + PostgreSQL + AWS SDK**, TypeScript.

- **Módulos:** `src/Api/NNN_Feature/` con 5 archivos: `feature.routes.ts`, `feature.controllers.ts`,
  `feature.queries.ts`, `feature.validations.ts`, `feature.model.ts` (+ submódulos numerados
  `001_Sub/`). Un módulo **sin persistencia** puede omitir `model`/`queries`.
- **URL:** `{env}/api/v1/:sLang/{module}/...`. El frontend llama al path del módulo
  (`/goals`, `/schools`, `/support/ticket`); el prefijo `/api/v1/:sLang` lo pone la base.
- **Rutas (patrón):**
  ```ts
  router.post('/ticket',
    aH(verifySchoolUserPermissions([{ sModuleName: 'General', sActionCode: 'WRITE' }])),
    celebrate({ body: SupportValidations.SendTicketBody }),
    aH(SupportController.sendTicket));
  ```
- **Auth / contexto:** `res.locals` trae `{ sLang, sSchoolId, sUserId }` (del middleware de auth).
  El usuario/colegio se sacan de ahí — **NO se piden en el body**.
- **Mensajes:** `Utils/SuccessMessage.util.ts` + `Utils/ErrorMessages.util.ts`, con claves
  `{ sp, en }` por idioma; se responden con `[sLang]`. **Esto alimenta el `message` que el
  frontend muestra solo** — por eso el backend debe devolver `message` (no lo hardcodea el front).
- **Correo (SES):** `Services/Mail.service.ts` → `MailEvent.emit('SendEmail', { aEmails, oData, sType, sSubject })`.
  Usa plantilla Handlebars en `src/Views/{sType}.html`. Config SES por env
  (`AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `EMAIL_SOURCE`).
- **Migraciones:** `knex/db/migrations/NNNN_Tabla_columnas.ts`, notación húngara
  (`s` string, `b` bool, `i` int, `d` decimal, `t` timestamp), PK uuid `s{Tabla}Id`.
  Correr con `npm run db:migrations`.

## Estado de los puntos

| # | Punto | Peso backend | Frontend | Contrato |
|---|---|---|---|---|
| 10 | Tickets de soporte | 1 endpoint + correo | ✅ Hecho | ✅ Cerrado |
| 8 | Tipos de ayuda | 2 columnas en TrackingRecords | ✅ Hecho (captura, gráfica, PDFs) | ✅ Cerrado |
| 5 | Modo terapeuta | 1 columna (`sAccountType`) + login | 🔄 En curso | ✅ Cerrado |
| 7 | Submetas | Tabla `SubGoals` + FK `sSubGoalId` + calculados | ✅ Hecho | ✅ Cerrado |
| 3 | Cobranza (Stripe) | Módulo completo | ⬜ Pendiente | 🔸 Borrador |

---

## ✅ Punto 10 — Tickets de soporte  (CERRADO)

> ⚠️ **Esta parte es del backend (según la cotización).** El Punto 10 dice textual:
> *"al enviar el formulario, se generará de manera automática una notificación por correo
> electrónico dirigida al buzón de soporte definido (info@myvillage.com.mx). En esta etapa,
> el alcance contempla únicamente el envío del correo."* El **frontend ya está hecho**
> (form + `POST`); falta el **servidor: recibir el POST y mandar el correo.**

### Contrato
`POST /support/ticket`
```jsonc
// body
{
  "sSubject": "…",   // requerido, máx 120
  "sMessage": "…",   // requerido, máx 1000
  "sCategory": "technical" // opcional: technical | question | suggestion | other
}
// response
{ "message": "Tu reporte fue enviado. Te contactaremos pronto." }
```

### Implementación (según los patrones de arriba)
Módulo nuevo **sin persistencia** — `src/Api/0XX_Support/`:

1. **`support.validations.ts`** — Joi `SendTicketBody`:
   `sSubject` string req `.max(120)`, `sMessage` string req `.max(1000)`,
   `sCategory` string opcional `.valid('technical','question','suggestion','other')`.
2. **`support.controllers.ts`** — `async sendTicket(req, res, next)`:
   - Lee `const { sLang, sUserId, sSchoolId } = res.locals;`
   - Toma nombre/correo/colegio del usuario (query a Users/Schools si hace falta).
   - Dispara el correo:
     ```ts
     MailEvent.emit('SendEmail', {
       aEmails: [process.env.SUPPORT_EMAIL || 'info@myvillage.com.mx'],
       oData: { sSubject, sMessage, sCategory, sReporterName, sReporterEmail, sSchoolName },
       sType: 'supportTicket',
       sSubject: `[Soporte] ${sSubject}`,
     });
     ```
   - Responde `res.status(200).json({ message: SuccessMessages.Support.sent[sLang] });`
3. **`support.routes.ts`** — `router.post('/ticket', aH(auth…), celebrate({ body: SendTicketBody }), aH(SupportController.sendTicket))`.
   Debe permitir a **cualquier usuario autenticado** (SchoolAdmin, FACULTY y SuperAdmin) — ajustar el gate de permisos para que superadmin también pase.
4. **Registrar** el router en el índice de rutas (`src/Api/000_Index`).
5. **Mailer** (`Services/Mail.service.ts`): agregar `'supportTicket'` al union `IMailTypes['sType']`
   y crear la plantilla **`src/Views/supportTicket.html`** (Handlebars: `{{sSubject}}`, `{{sMessage}}`,
   `{{sCategory}}`, `{{sReporterName}}`, `{{sReporterEmail}}`, `{{sSchoolName}}`).
6. **Mensajes** (`Utils/SuccessMessage.util.ts`): agregar
   `Support: { sent: { sp: "Tu reporte fue enviado…", en: "Your report was sent…" } }`.

> Sin tabla, sin panel, sin historial (fuera de alcance de esta etapa).

---

## ✅ Punto 8 — Tipos de ayuda  (CERRADO)

Documentar, en cada **registro de seguimiento** (`TrackingRecords`), el apoyo dado al alumno.
**No afecta** resultado ni cálculos (progreso/promedio/conteo) — es documental, como una nota.
Los 8 tipos están disponibles en **cada** registro; al crear la meta no cambia nada. **Un solo
tipo por registro.**

### Migración
`knex/db/migrations/NNNN_TrackingRecords_helpType.ts` — `alterTable('TrackingRecords')`:
```ts
export async function up(Knex): Promise<void> {
  return Knex.schema.alterTable('TrackingRecords', (table: any) => {
    table.string('sHelpType').defaultTo('');    // enum lógico (abajo); '' = sin dato
    table.integer('iHelpAmount').defaultTo(0);  // cantidad de ayudas otorgadas
  });
}
export async function down(Knex): Promise<void> {
  return Knex.schema.alterTable('TrackingRecords', (table: any) => {
    table.dropColumn('sHelpType');
    table.dropColumn('iHelpAmount');
  });
}
```

### Enum de `sHelpType`
`independiente | ayuda_general | visual | verbal | escrita | gestual | modelacion | fisica`
(o `''`). El backend guarda **solo el slug**; el label lo resuelve el frontend por idioma.

### Wire (importante)
Estos dos campos viajan **con el mismo nombre** front↔back (`sHelpType`, `iHelpAmount`) —
**no** hay traducción de nombres como en otros campos del registro (`iHits`/`iCorrect`, etc.).
- **Create / Update** de registro: aceptar `sHelpType` (opcional, string, uno de los enum) e
  `iHelpAmount` (opcional, integer ≥ 0). Validar con Joi en `trackingRecords.validations.ts`.
- **GET** de registros: devolverlos tal cual (para pintar color/cantidad en la gráfica).
- **NO** entran en ningún cálculo (`getRecordPercentage`, promedio, progreso).

Archivos a tocar: `024_Goals/003_TrackingRecords/` (`.validations.ts`, `.queries.ts`,
`.controllers.ts` si aplica) + la migración.

---

## ✅ Punto 5 — Modo terapeuta  (CERRADO)

Una cuenta (colegio) puede ser de tipo **SCHOOL** o **THERAPIST**. En modo THERAPIST el
**frontend** adapta terminología (colegio→terapeuta, alumnos→**Pacientes**, maestros→terapeutas,
Docente→Terapeuta) y **oculta** IEP, carga de documentos y creación de usuarios. El backend solo
necesita el **tipo de cuenta** y exponerlo en el login.

### Migración
`knex/db/migrations/NNNN_Schools_sAccountType.ts` — `alterTable('Schools')`:
```ts
export async function up(Knex): Promise<void> {
  return Knex.schema.alterTable('Schools', (table: any) => {
    table.string('sAccountType').defaultTo('SCHOOL'); // 'SCHOOL' | 'THERAPIST'
  });
}
export async function down(Knex): Promise<void> {
  return Knex.schema.alterTable('Schools', (table: any) => {
    table.dropColumn('sAccountType');
  });
}
```

### Dónde se asigna
El **superadmin** elige el tipo al **crear** el colegio (`POST /schools`) y lo puede **editar**
(`PUT /schools/:id`). Aceptar `sAccountType` en ambos payloads (validar enum
`SCHOOL | THERAPIST`; default `SCHOOL`). Devolverlo en el GET del colegio.

### Login (clave)
**Incluir `sAccountType` en el payload de `/auth/login`**, dentro de `oResults.oSchool` (junto a
`sSchoolId`/`sSchoolName`). El frontend lo lee para activar el modo terapeuta.

### Enforcement (opcional, no bloqueante)
El frontend ya **oculta** creación de usuarios, IEP y carga de documentos en modo terapeuta. Si
se quiere endurecer, el backend puede rechazar esos `POST` cuando la cuenta es THERAPIST (defensa
en profundidad). No es requisito para integrar.

Archivos a tocar: la migración + `022_Schools` (`.validations.ts`/`.queries.ts` de create/update)
+ `003_Authentication` (agregar `sAccountType` al `oSchool` del login).

---

## ✅ Punto 7 — Submetas  (CERRADO — frontend construido)

Una meta puede dividirse en hasta **5 submetas** (1 nivel, sin anidar). **Cada submeta se comporta
como una meta completa** (misma config, sus propios registros, su propio estado y gráfica); la meta
principal es el contenedor "anual" y muestra un **rollup**. Las metas sin división siguen igual.

### Decisiones (PO)
- Submetas con **CRUD normal**: se crean al crear la meta **y también después**; se editan y se
  eliminan. **No** se reordenan.
- Límite **5** (constante configurable en el front).
- **Sin máquina secuencial:** cada submeta tiene su propio estado (activa/completada/no alcanzada/
  pausada), **activa por default**; NO hay "una sola activa" ni "cerrar para avanzar". ⚠️ *Esto se
  desvía de la cotización (que pedía secuencial) — decisión del PO.*
- **Registros → submeta.** La meta principal **no** tiene registros propios cuando está dividida.
- **Tipo de medición se hereda** de la meta principal (inmutable en las submetas).
- **Avance de la meta principal** = dos indicadores: (a) **progreso = promedio SOLO de las submetas
  ya iniciadas** (con ≥1 registro) — las vacías NO entran para no dar falso negativo; (b) **"N/total
  etapas completadas"**. Cada submeta se calcula como meta normal desde sus registros. La principal
  se **completa cuando TODAS las submetas están cerradas** (completada / no alcanzada).

### Migraciones
- `NNNN_SubGoals.ts` — tabla `SubGoals`, hija de `Goals` (FK `sGoalId`), PK `sSubGoalId`. Campos
  editables por submeta: `sDescription`, `tStartDate`, `tTargetDate`, `tCompletedDate`,
  `sCompletionNotes`, `iTargetValue`, `iTargetDuration`, `iScaleMin`, `iScaleMax`, `sFrequencyUnit`,
  `iBaselineValue`, `sDirection`, `iTargetOpportunities`, `iTargetPercentage`, `sStatus`, `iOrder`
  + auditoría estándar. **Sin** `sMeasurementType` (se hereda del `Goal`).
- `NNNN_TrackingRecords_sSubGoalId.ts` — FK **nullable** `sSubGoalId` en `TrackingRecords` (los
  registros de metas divididas apuntan a la submeta; las metas sin dividir siguen usando `sGoalId`).

### Endpoints (exactos — así los llama el frontend ya construido)
- `GET  /goals/:sGoalId/subGoals` — lista de submetas de la meta. Respuesta en `data.aData`
  (array de submetas). Cada submeta debe traer sus **campos calculados** (abajo).
- `POST /goals/:sGoalId/subGoals` — crear submeta. Body = misma config que una meta **sin**
  `sTitle`/`sMeasurementType` (se heredan): `sDescription`, fechas, `iTargetValue`, `iScaleMin/Max`,
  `sFrequencyUnit`, `iBaselineValue`, `sDirection`, `iTargetOpportunities`, `aTasks`, etc.
- `PUT    /subGoals/:sSubGoalId` — editar submeta (misma forma).
- `DELETE /subGoals/:sSubGoalId` — eliminar submeta (y sus registros).
- `GET  /subGoals/:sSubGoalId/trackingRecords` — registros de una submeta (`data.aData`).
- `POST /trackingRecords` con **`sSubGoalId`** en el body — crea el registro ligado a la submeta
  (mismo endpoint de registros; solo agrega `sSubGoalId`).
- La meta principal devuelve **`bHasSubGoals: true`** en `GET /goals/:id` cuando está dividida
  (el frontend muestra el gestor de submetas en vez del detalle normal).

### Campos calculados (read-only) por submeta
En cada submeta del `GET`: `dProgress` (%), `dAverageValue`, `iRecordsCount`, `tLastRecord` —
misma lógica que hoy usa una meta, pero sobre los registros de esa submeta.

### Rollup de la meta principal
Lo calcula el **frontend** a partir de las submetas (promedio del `dProgress` de las **iniciadas**
+ "N cerradas / total"). El backend solo entrega bien los `dProgress`/`iRecordsCount` por submeta.

### Módulo
`src/Api/0XX_SubGoals/` (o submódulo de `024_Goals/`) con routes/controllers/queries/validations/model.

---

## 🔸 Punto 3 — Cobranza automática (Stripe)  (borrador)

Suscripciones mensuales de colegios vía Stripe. Sin CFDI (propuesta aparte). **Es lo más pesado.**

- **Stripe SDK** en backend: customers, payment methods (tokenización), subscriptions, **webhooks**.
- **Cobro recurrente** mensual (cron/scheduler) con el método configurado.
- **Migraciones:** columnas de tarifa en `Schools` (`sBillingType`, `dFixedAmount`,
  `dAmountPerTeacher`, `dAmountPerStudent`, `dDiscountPct`, estado de suscripción/morosidad) +
  tabla `Payments` (historial: monto, fecha, método, id Stripe).
- **Tarifa variable:** calcular sobre `iUsersLimit`/`iStudentsLimit` (límites), NO sobre el
  conteo real. **Confirmar qué modalidad eligió el cliente (fija vs variable).**
- **Pagos fallidos:** 2 reintentos → moroso + email al usuario principal (usar `MailEvent`).
- **Suspensión** inmediata al morosear; incluir el estado en el payload de login para gatear en
  el middleware/`res.locals` a TODOS los usuarios del colegio. Sin borrado de datos.
- **Requisitos del cliente:** cuenta Stripe + llaves (test/live), moneda MXN.

*(Contrato exacto al construir el frontend.)*

---

## Cómo evoluciona este documento
Conforme construimos el frontend de cada punto, su sección pasa de 🔸 borrador a ✅ cerrado, con
el contrato exacto. Orden sugerido: 10 ✅ → 8 → 5 → 7 → 3.
