# GoHighLevel MCP Server

Servidor MCP (Model Context Protocol) que expone datos de GoHighLevel (API v2 /
LeadConnector) a Claude: contactos, oportunidades, pipelines, workflows
(automatizaciones), calendarios, citas, conversaciones/mensajes y usuarios
(agentes).

## 1. Obtener la API Key de GoHighLevel

1. Entra a la sub-cuenta (Location) de GoHighLevel que quieres consultar.
2. Ve a **Settings → Business Info**.
3. Copia el **Location ID**.
4. Busca la sección de **API Key** (Private Integration) y genera/copia la
   key privada. Guárdala de forma segura, no la compartas ni la subas al
   repositorio.

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y completa:

```
GHL_API_KEY=tu_api_key_privada
GHL_LOCATION_ID=tu_location_id
```

`.env` está en `.gitignore` y nunca debe commitearse.

## 3. Instalar y compilar

```bash
npm install
npm run build
```

## 4. Probar en local (opcional)

```bash
npm run dev
```

El proceso queda escuchando por stdio, como espera cualquier cliente MCP.

## 5. Conectarlo a Claude Code

Dentro de Claude Code, ejecuta:

```
/mcp
```

y agrega un servidor de tipo **stdio** con:

- **Comando**: `node`
- **Args**: `["/ruta/absoluta/al/repo/dist/index.js"]`
- **Variables de entorno**: `GHL_API_KEY`, `GHL_LOCATION_ID`

O bien, edita directamente `.mcp.json` (a nivel de proyecto) o tu config de
usuario:

```json
{
  "mcpServers": {
    "gohighlevel": {
      "command": "node",
      "args": ["/ruta/absoluta/al/repo/dist/index.js"],
      "env": {
        "GHL_API_KEY": "tu_api_key_privada",
        "GHL_LOCATION_ID": "tu_location_id"
      }
    }
  }
}
```

Reinicia Claude Code para que cargue el nuevo servidor.

## Herramientas disponibles

| Herramienta | Descripción |
|---|---|
| `ghl_search_contacts` | Busca contactos por nombre, email o teléfono |
| `ghl_get_contact` | Detalle de un contacto |
| `ghl_list_contact_tasks` | Tareas asignadas sobre un contacto |
| `ghl_list_pipelines` | Pipelines de ventas y sus etapas |
| `ghl_search_opportunities` | Busca oportunidades/deals |
| `ghl_get_opportunity` | Detalle de una oportunidad |
| `ghl_list_workflows` | Lista workflows/automatizaciones |
| `ghl_list_calendars` | Calendarios configurados |
| `ghl_list_appointments` | Citas en un rango de fechas |
| `ghl_get_appointment` | Detalle de una cita |
| `ghl_search_conversations` | Conversaciones (SMS/email/chat) |
| `ghl_get_conversation_messages` | Mensajes de una conversación |
| `ghl_list_users` | Usuarios/agentes con acceso a la sub-cuenta |
| `ghl_get_user` | Detalle de un usuario/agente |

## Notas

- Todas las lecturas son de solo lectura (GET); este servidor no modifica
  datos en GoHighLevel.
- Los endpoints siguen la documentación oficial de la API v2 de GoHighLevel
  (https://services.leadconnectorhq.com). Si alguna ruta cambia o tu cuenta
  tiene permisos distintos, revisa el mensaje de error devuelto por la
  herramienta — incluye el código HTTP y el cuerpo de la respuesta de GHL.
- Si necesitas también **escribir** datos (crear contactos, mover
  oportunidades de etapa, etc.), se pueden agregar nuevas herramientas
  siguiendo el mismo patrón en `src/index.ts`.
