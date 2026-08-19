# Ejecución — Puntos frontend de la ampliación (24/jul/2026)

> Checklist vivo. Palomeamos (`[x]`) conforme avanzamos. Solo puntos **puramente frontend** (🟢).
> Orden: **P11 → P13**. Incremental: probar cada pieza antes de seguir.
> Estándares obligatorios: notación húngara · `.then/.catch/.finally` (NUNCA async/await + try/catch) · i18n ES+EN alineados · componentes reusables Core/Forms · `$t()`/`useI18n()` desde el inicio.

---

## Estado general

| Punto | Descripción | Estado |
|---|---|---|
| **11** | Constructor de metas guiado (dinámico, no imagen) | ✅ **Terminado** (build OK + QA usuario) |
| **13** | Módulo de capacitaciones (JSON-driven + player custom) | ✅ Implementado (build OK) · falta QA manual |

---

# PUNTO 11 — Constructor de descripción de metas (guiado) 🟢

**Decisión de alcance:** en vez de la imagen estática cotizada, se implementa un **constructor programado (HTML)**: la descripción se compone por 8 segmentos de color (Estudiante · Tiempo · Acción · Línea base · Criterio de logro · Contexto · Apoyo · Seguimiento) con leyenda/guía arriba. Prototipo aprobado: `scratchpad/goal-builder-proto.html`.

**Invariante clave:** salida = **una sola oración concatenada** en `sDescription`. **Cero cambios de backend.** Modo "Texto libre" para editar metas existentes (texto plano).

## Arquitectura de archivos

| Archivo | Acción | Rol |
|---|---|---|
| `app/utils/goalDescriptionSegments.ts` | crear | Config de los 8 segmentos: `sKey`, `sLabelKey`, `sQuestionKey`, `sExampleKey`, `sColorToken`. Sin texto hardcodeado — solo claves i18n. |
| `app/components/goals/GoalDescriptionBuilder.vue` | crear | Componente del constructor: leyenda + composer inline + hint + toggle Guiado/Libre. `v-model` → string `sDescription`. Prop `bIsEdit`. |
| `app/assets/css/main.css` | editar | Tokens de color reusables `--seg-<key>-fg/-bg/-dot` (light + dark). No colores inline en el componente. |
| `app/components/goals/GoalForm.vue` | editar | Reemplazar el `FormsTextArea` de descripción (`:17-22`) por `<GoalsGoalDescriptionBuilder v-model="oFormData.sDescription" :b-is-edit="bIsEdit" />`. |
| `i18n/locales/es.json` | editar | Namespace `goals.builder.*` (ES). |
| `i18n/locales/en.json` | editar | Namespace `goals.builder.*` (EN), alineado 1:1. |

## Claves i18n a agregar (`goals.builder.*`, en **ambos** archivos)

**Chrome del componente:**
| Clave | ES | EN |
|---|---|---|
| `legendTitle` | Una meta clara responde: | A clear goal answers: |
| `modeGuided` | Guiado | Guided |
| `modeFree` | Texto libre | Free text |
| `tipLabel` | Consejo | Tip |
| `tipDefault` | Haz clic en un segmento de color y escribe. Puedes dejar en blanco los que no apliquen. | Click a colored segment and type. You can leave blank the ones that don't apply. |
| `verExample` | Ver ejemplo | See example |
| `exampleEyebrow` | Ejemplo | Example |
| `clear` | Limpiar | Clear |
| `autoStudentNote` | El nombre del estudiante se completa solo | The student's name is filled in automatically |
| `ruleGuided` | Guiado: se guardan los segmentos de color. | Guided: the colored segments are saved. |
| `ruleFree` | Texto libre: editas la descripción completa a mano. | Free text: you edit the whole description by hand. |
| `freePlaceholder` | Escribe la descripción de la meta… | Write the goal description… |

> Nota: NO se muestra al usuario ninguna nota técnica ni el nombre del campo (`sDescription`). El composer ya es la oración; sin caja de "preview".

**Segmentos** (`goals.builder.seg.<key>.{label,question,example}` × 8):
| key | label ES / EN | question ES | example ES |
|---|---|---|---|
| `estudiante` | Estudiante / Student | ¿Quién? — nombre del estudiante | Mateo, |
| `tiempo` | Tiempo / Time | ¿Para cuándo? — plazo o ciclo escolar | al finalizar el ciclo escolar 2025–2026, |
| `accion` | Acción / Action | ¿Qué hará? — verbo observable | escribirá palabras bisílabas simples |
| `linea` | Línea base / Baseline | ¿Desde dónde parte? — nivel actual | partiendo de un nivel presilábico, |
| `criterio` | Criterio de logro / Success criterion | ¿Qué tan bien? — % o medida de éxito | con 80% de precisión, |
| `contexto` | Contexto / Context | ¿Dónde y cuándo? — la situación | durante actividades de escritura en el aula de recursos, |
| `apoyo` | Apoyo / Support | ¿Con qué ayuda? — andamiaje o material | con apoyo de tarjetas visuales como modelo, |
| `seguimiento` | Seguimiento / Monitoring | ¿Cómo se mide? — evidencia de avance | medido a través de muestras de trabajo y registro de observación directa. |

> `example` EN: traducir cada ejemplo (versión inglesa de la meta de Mateo) al poblar `en.json`.
> Validar parity al final con el script de `docs/I18N_TRACKER.md`.

## Contrato técnico (aterrizado al código real)

**Convenciones a calcar** (leídas de `GoalForm.vue` + `forms/TextArea.vue`):
- **Options API** (`export default { name, props, data, computed, watch, methods }`), NO `<script setup>`.
- Notación húngara en todo. i18n con `this.$t('clave')`.
- Componente propio con `modelValue` + `emits:['update:modelValue']`; exponer `executeValidate()` si el form lo llama (aquí la descripción es opcional → no obligatorio, pero mantener la firma).
- CSS `<style scoped>`, tokens `var(--color-*)` / `var(--radius-*)`, clases estilo `mv-*` / BEM.
- **Sin async/await + try/catch.** (Este componente no hace llamadas API, así que no aplica, pero cualquier fetch va con `.then/.catch`.)

**Técnica de edición:** `contenteditable` por segmento (los segmentos largos deben envolver en varias líneas como la foto — un `<input>` no lo hace). Patrón seguro anti-brinco-de-cursor: inicializar el texto en `mounted()`, leer `textContent` en `@input`, **nunca** reescribir el nodo mientras está enfocado; cambios programáticos (Limpiar / auto-estudiante) solo sobre nodos no enfocados.

**Bloque de tokens en `main.css`** (agregar dentro del `:root` existente, tras la paleta de marca):
```css
/* Goal description builder — paleta de segmentos (Punto 11) */
--goal-seg-ink: var(--color-secondary-600);
--goal-seg-estudiante-bg:#C7E9EA;  --goal-seg-estudiante-dot:var(--color-primary-500);
--goal-seg-tiempo-bg:#DEDEF8;      --goal-seg-tiempo-dot:#8188E6;
--goal-seg-accion-bg:#FBE7C1;      --goal-seg-accion-dot:#F2A93C;
--goal-seg-linea-bg:#D2F0D9;       --goal-seg-linea-dot:var(--color-green-500);
--goal-seg-criterio-bg:#FAD7E2;    --goal-seg-criterio-dot:var(--color-pink-500);
--goal-seg-contexto-bg:#D5EDF9;    --goal-seg-contexto-dot:#66C4E6;
--goal-seg-apoyo-bg:#E7DAF4;       --goal-seg-apoyo-dot:#A47DDB;
--goal-seg-seguimiento-bg:#FCF1C5; --goal-seg-seguimiento-dot:var(--color-yellow-500);
```
Reusa marca donde existe (teal/verde/amarillo/pink); agrega periwinkle, ámbar, cielo y morado que faltaban. Texto = `--color-secondary-600`.

**Props del componente** `GoalDescriptionBuilder`:
- `modelValue: String` (el `sDescription`) · `sStudentName: String` (auto-estudiante, bloqueado) · `bIsEdit: Boolean` (arranca en Texto libre).

**Estructura i18n** — objeto anidado `goals.builder` en `es.json` + `en.json`:
```
goals.builder = { legendTitle, modeGuided, modeFree, tipLabel, tipDefault,
  verExample, exampleEyebrow, clear, autoStudentNote, freePlaceholder, ruleGuided, ruleFree,
  seg: { estudiante:{label,question,example}, tiempo:{…}, …8 } }
```

**Integración (páginas):**
- `goals/add.vue:11-15` → agregar `:s-student-name="sStudentName"` al `<GoalsGoalForm>` (el dato ya se fetchea en `mounted`).
- `goals/[goalId]/edit.vue` → pasar `sStudentName` igual (fetchear el alumno si no lo tiene) para modo Guiado.
- `GoalForm.vue` → nueva prop `sStudentName`; reemplazar `FormsTextArea` (`:17-22`) por `<GoalsGoalDescriptionBuilder v-model="oFormData.sDescription" :s-student-name="sStudentName" :b-is-edit="bIsEdit" />`. `oFormData.sDescription` y el payload (`:641`) NO cambian.

## Decisiones de comportamiento (confirmadas / por confirmar)
- **Segmentos opcionales** (se pueden dejar en blanco). *(confirmar: ¿Acción + Estudiante obligatorios?)*
- **Nuevas metas** → arrancan en modo Guiado. **Edición** (`bIsEdit`) → arranca en Texto libre con el `sDescription` existente.
- **Bilingüe ES+EN** en leyenda, consejos y ejemplos. *(confirmar)*

## Checklist P11

- [x] **1. Tokens de color** — bloque `--goal-seg-*` en `main.css` (`:root`, tras la paleta de marca).
- [x] **2. Config de segmentos** — `app/utils/goalDescriptionSegments.ts` con las 8 entradas (`IGoalDescriptionSegment`, solo claves i18n + `bLocked`).
- [x] **3. i18n** — `goals.builder.*` en `es.json` + `en.json` (36 claves). Parity validada: 1103 = 1103 ✅.
- [x] **4. Componente base** — `GoalDescriptionBuilder.vue`: leyenda + composer contenteditable + placeholder por color.
- [x] **5. Composición** — `assemble()` + `emitValue()` → `update:modelValue`. Estudiante solo cuenta si hay contenido real.
- [x] **6. Hint activo** — `sActiveKey` → pregunta del segmento + resaltado del chip en leyenda.
- [x] **7. Acciones** — "Ver ejemplo" (popover read-only) + "Limpiar" (conserva estudiante).
- [x] **8. Toggle Guiado/Libre** — `FormsTextArea` en modo libre; siembra sin forzar estudiante; reglas de modo.
- [x] **9. Integración en `GoalForm.vue`** — prop `sStudentName` + reemplazo del `FormsTextArea` por el builder. Payload intacto.
- [x] **10. Páginas** — `add.vue` y `edit.vue` pasan `:s-student-name`. Edit arranca en Texto libre (via `bIsEdit`).
- [x] **11. Build** — `yarn build` OK en 31s (exit 0, "✨ Build complete!"). Compila SFC + i18n + tokens sin errores.
- [x] **12. QA manual** — validado en `yarn dev` por el usuario ("está perfecto"). Iteraciones de UX aplicadas: ejemplo como colapsable inline entre guía y campo; toggle Guiado/Texto libre en row visible encima del campo; guía + ejemplo visibles en ambos modos.

---

# PUNTO 13 — Módulo de capacitaciones 🟢

Vista nueva "Capacitaciones": videos organizados en carpetas + buscador. Carga estática por código.

## Decisiones lockeadas
- **JSON-driven:** TODO se genera desde `public/data/trainings.json`, **cargado en runtime** (editable sin recompilar). Cero hardcodeo.
- **G15 — Hosting mixto por video:** cada video trae `type` en el JSON → `local` (archivo en `public/videos/`) o `youtube`/`vimeo` (embed). Migrar/mezclar = editar el JSON, sin tocar código.
- **Reproductor:** local → `<video>` con **controles custom** (sin descarga, `controlsList="nodownload"`, sin menú contextual, sin PiP). Embed → `<iframe>`.
- **G16 — Audiencia:** **todos** (SuperAdmin + SchoolAdmin + FACULTY). Sin `sModule` → sin permiso backend.
- **Idioma:** UI bilingüe (`$t()`); títulos/desc de videos en el JSON (contenido ES).

## Arquitectura de archivos
| Archivo | Acción | Rol |
|---|---|---|
| `public/data/trainings.json` | crear | **Fuente única de verdad.** `{ folders: [{ id, name, icon, videos: [{ id, title, description, type, src, thumbnail?, duration? }] }] }`. Editable sin rebuild. |
| `app/utils/trainings.ts` | crear | Interfaces TS (`ITrainingFolder`/`ITrainingVideo`) + loader `getTrainings()` (fetch + normaliza el JSON). |
| `app/components/trainings/VideoCard.vue` | crear | Card reusable (thumbnail + título + duración + desc), clickable → emit `play`. |
| `app/components/trainings/VideoPlayer.vue` | crear | Reproductor: `local` con barra de controles custom (play/seek/tiempo/volumen/fullscreen, sin descarga); `youtube`/`vimeo` con iframe. Reusable. |
| `app/pages/admin/trainings/index.vue` | crear | Página (Options API). Fetch del JSON; estados `sSearchQuery`/`sActiveFolderId`/`oActiveVideo`; player en `UModal`. |
| `app/layouts/admin.vue` | editar | Item en `aNavItems()`: `{ sUrl:'/admin/trainings', sIcon:'i-heroicons-play-circle', sName:$t('modules.capacitaciones'), aAllowedUserTypes:['SuperAdmin','SchoolAdmin','FACULTY'] }` (sin `sModule`). |
| `i18n/locales/{es,en}.json` | editar | `modules.capacitaciones`, `crumbs.capacitaciones`, `seo.capacitaciones.*`, namespace `capacitaciones.*`. |
| `public/videos/` + `public/images/trainings/` | crear | `.mp4` y thumbnails (placeholders para arrancar). |

## Flujo UX
1. **Vista carpetas:** grid de `CoreCardsCard` (icono + nombre + "N videos").
2. **Click carpeta:** grid de `TrainingsVideoCard` + botón "← Volver a carpetas".
3. **Click video:** modal player (`UModal` + `<video controls>`; listo para embed).
4. **Buscar** (`FormsSearchField` debounced): filtra videos de TODAS las carpetas → grid plano; limpiar → regresa a carpetas.

## Checklist P13
- [x] 1. `public/data/trainings.json` (fuente) + `app/utils/trainings.ts` (loader tipado + `getEmbedUrl`). 3 carpetas dummy, mezcla local/youtube.
- [x] 2. i18n `modules/crumbs/seo/capacitaciones.*` en ES+EN. Parity validada: 1125 = 1125 (17 claves nuevas).
- [x] 3. Item en sidebar (`aNavItems`, sin `sModule` → visible a todos).
- [x] 4. Página `capacitaciones/index.vue`: header + buscador + vista de carpetas + gating por ruta.
- [x] 5. `TrainingsVideoCard.vue` + vista de videos de carpeta + botón volver.
- [x] 6. Búsqueda flat (título/desc/carpeta, todas las carpetas).
- [x] 7. `TrainingsVideoPlayer.vue` (controles custom sin descarga para `local`; iframe para `youtube`/`vimeo`) en `UModal`; se desmonta al cerrar (corta reproducción).
- [x] 8. Estados vacíos + error de carga (`CoreEmptyState`).
- [x] 9. Build de producción OK (exit 0, 16s). Compila todo.
- [ ] 10. QA manual del usuario: navegar carpetas → video → player; buscar; abrir un YouTube y un local; ES↔EN.

---

## Gaps abiertos que tocan estos puntos
- P11: obligatoriedad de segmentos · confirmar bilingüe.
- P13: G15 (hosting videos) · G16 (quién ve).
