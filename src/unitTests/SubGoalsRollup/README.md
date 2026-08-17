# Punto 7 — Rollup de submetas y título propio

Pruebas de integración para los dos puntos de backend del feedback de Lucy (17/agosto/2026),
documentados en
`documentationForFront/NewScopeAug2026/newFixesAug17/feedback-lucy-agosto2026-backend.md`.

```bash
npm run test:subgoals          # todo
npm run test:subgoals -- 02    # solo 02_parentRollup
```

**66 aserciones, 0 fallos, ~32 s.**

---

## Qué prueban

No son pruebas unitarias con mocks: levantan la aplicación Express real (`supertest`) contra la base
de datos **development** real, en orden y en serie, y borran físicamente todo lo que crean.

| Archivo | Cubre |
|---|---|
| `01_subGoalTitle` | La submeta guarda su **propio** `sTitle` al crearse y al editarse; un título vacío hereda el de la meta padre; una edición parcial no borra el resto |
| `02_parentRollup` | El `dProgress` de la meta padre es el **promedio de TODAS** sus submetas activas (las vacías cuentan como 0); `iRecordsCount` es la suma y `tLastRecord` el más reciente; `GET /goals/:id` y `GET /goals/student/:id` sirven ese número; crear, capturar y borrar submetas lo recalculan |
| `03_studentReport` | `GET /students/:id/report` ya incluye la meta dividida (antes **desaparecía**), con los registros de sus submetas en su tarjeta, cada uno etiquetado con `sSubGoalId` / `sSubGoalTitle`; las submetas nunca aparecen como metas propias; capturar directo en la meta dividida sigue devolviendo 409 |

## Criterios de aceptación del documento de feedback

Ambos se prueban de forma literal:

1. *"Una meta dividida cuyas submetas promedian, p. ej., 76% debe mostrar 76% (no 0)"* →
   `02_parentRollup`: dos etapas al 90% y 0% dan **45%** en la meta padre, y ese mismo 45% sale en
   `GET /goals/:id` y en la lista del alumno.
2. *"Crear una submeta con `sTitle:"Etapa 1 — Vocales"` y que `GET /goals/:id/subGoals` devuelva ese
   mismo texto"* → `01_subGoalTitle`.

## Regla de negocio que fija esta suite

> **`dProgress` de la meta padre = promedio de `dProgress` de TODAS las submetas activas.**
> Una submeta sin registros cuenta como **0**, no se omite.

Es la decisión del PO del 14/agosto/2026 y **difiere** del `getSubGoalsRollup()` del frontend, que
promedia solo las submetas iniciadas. Mientras el frontend no se alinee, el gestor de submetas puede
mostrar un porcentaje distinto al de la tarjeta cuando alguna etapa esté vacía. Registrado en
`documentationForFront/NewScopeAug2026/frontEndChanges.md`.

## Seguridad

* **Solo `development`.** `assertSafeDatabase()` aborta antes de la primera consulta si
  `current_database()` no es `development` — la suite escribe metas y registros.
* **Sin residuo.** Todo lo creado se titula `ZZTEST-P7…`, se borra en el teardown (registros →
  submetas → metas, respetando la FK `sParentGoalId`) y un chequeo final falla la corrida si queda
  algo. No toca metas, submetas ni registros preexistentes.
* **Sin contraseñas.** Los tokens se emiten con el propio `AuthServices.createToken`, y las sesiones
  se eliminan al terminar.

## Fixtures

Se elige un colegio con usuario principal (`Users.sCreatedBy IS NULL`), no bloqueado, no suspendido,
**con un alumno activo**. El alumno tiene que estar activo: todos los agregados de metas hacen JOIN
con `Students` filtrando `bActive`, así que una meta de un alumno inactivo desaparece de las
consultas bajo prueba — ese detalle ya invalidó un resultado en este proyecto.

## Relación con la migración

`3038_Goals_backfillSubGoalRollup` recalcula el rollup **una vez** para las metas divididas que
existían antes de este cambio. Estas pruebas cubren el camino en vivo (crear/capturar/borrar); la
migración cubre lo histórico. Las dos usan exactamente la misma regla.
