# Contrato de API — Tickets de soporte (Ampliación P10)

> Guía para el equipo de backend. El **frontend ya está construido** y llama a este
> endpoint; solo falta implementarlo del lado del servidor.
> Alcance de esta etapa (según la cotización): **solo enviar el correo de notificación**.
> No hay panel interno ni seguimiento de tickets (eso sería propuesta aparte).

## Endpoint requerido

```
POST /support/ticket
```

- **Auth:** requiere el token del usuario (mismo esquema que el resto de la API —
  header `Authorization`). El backend identifica al usuario a partir del token.

### Request body (lo que manda el frontend)

```jsonc
{
  "sSubject": "No puedo generar el PDF de reporte",   // requerido, máx 120 chars
  "sMessage": "Al dar clic en Exportar no pasa nada…", // requerido, máx 1000 chars
  "sCategory": "technical"                              // opcional; puede venir ausente
}
```

- `sCategory` ∈ `"technical" | "question" | "suggestion" | "other"` (o ausente).
  Son valores fijos; el label lo resuelve el frontend por idioma.
- El frontend **no** envía datos del usuario: el backend los toma del token
  (id, nombre, correo, colegio) para incluirlos en el correo.

### Comportamiento esperado

1. Validar `sSubject` y `sMessage` no vacíos.
2. Componer y enviar un correo a **`info@myvillage.com.mx`** con:
   - Asunto sugerido: `[Soporte] {sSubject}` (o `[{sCategory}] {sSubject}`).
   - Cuerpo: el `sMessage` + datos del usuario que reporta (nombre, correo,
     colegio/`sSchoolId`, tipo de usuario) para poder responderle y ubicar el contexto.
3. Responder al frontend.

### Response

Éxito (200/201):
```json
{ "message": "Tu reporte fue enviado. Te contactaremos pronto." }
```

Error (4xx/5xx):
```json
{ "message": "No se pudo enviar el reporte. Intenta de nuevo." }
```

> **Importante (convención del proyecto):** el interceptor de axios del frontend
> muestra automáticamente `response.data.message` como alerta de éxito/error.
> Por eso el backend **debe** devolver un `message` claro y ya localizado — el
> frontend no hardcodea mensajes para esta acción.

## Lado del frontend (ya implementado, referencia)

- Botón de soporte en el appbar: `app/layouts/admin.vue` (topbar, junto al switcher de idioma).
- Modal + formulario: `app/components/support/TicketModal.vue`.
- Llamada: `$api.post('/support/ticket', { sSubject, sMessage, sCategory? })`
  con `.then/.catch/.finally`; al éxito cierra y limpia el form.
- i18n: namespace `support.*` en `i18n/locales/{es,en}.json`.

## Notas / futuro (fuera de alcance de esta etapa)
- Sin persistencia de tickets ni panel de administración (propuesta independiente).
- Si más adelante se quiere historial/estado de tickets, se agregaría tabla
  `SupportTickets` + endpoints CRUD; el contrato de este `POST` seguiría sirviendo.
