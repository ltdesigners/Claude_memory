#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ghlGet, locationId, toEpochMillis, GhlApiError } from "./ghlClient.js";

const server = new McpServer({
  name: "gohighlevel-mcp-server",
  version: "1.0.0",
});

function asText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function asError(err: unknown) {
  const message =
    err instanceof GhlApiError
      ? err.message
      : err instanceof Error
      ? err.message
      : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

// ---------- Contactos ----------

server.tool(
  "ghl_search_contacts",
  "Busca contactos en GoHighLevel por nombre, email, teléfono, etc.",
  {
    query: z.string().optional().describe("Texto de búsqueda (nombre, email, teléfono)."),
    limit: z.number().int().min(1).max(100).default(20),
    startAfterId: z.string().optional().describe("Para paginar, el contactId del último resultado de la página anterior."),
  },
  async ({ query, limit, startAfterId }) => {
    try {
      const data = await ghlGet("/contacts/", {
        locationId: locationId(),
        query,
        limit,
        startAfterId,
      });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_get_contact",
  "Obtiene el detalle completo de un contacto por su ID.",
  { contactId: z.string() },
  async ({ contactId }) => {
    try {
      const data = await ghlGet(`/contacts/${encodeURIComponent(contactId)}`);
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_list_contact_tasks",
  "Lista las tareas pendientes/asignadas de un contacto (útil para ver qué debe hacer un agente con ese lead).",
  { contactId: z.string() },
  async ({ contactId }) => {
    try {
      const data = await ghlGet(`/contacts/${encodeURIComponent(contactId)}/tasks`);
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

// ---------- Oportunidades / Pipelines ----------

server.tool(
  "ghl_list_pipelines",
  "Lista los pipelines de ventas configurados en la sub-cuenta, con sus etapas.",
  {},
  async () => {
    try {
      const data = await ghlGet("/opportunities/pipelines", { locationId: locationId() });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_search_opportunities",
  "Busca oportunidades (deals) por pipeline, etapa, contacto o estado.",
  {
    pipelineId: z.string().optional(),
    pipelineStageId: z.string().optional(),
    contactId: z.string().optional(),
    status: z.enum(["open", "won", "lost", "abandoned", "all"]).optional(),
    assignedTo: z.string().optional().describe("userId del agente asignado."),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async ({ pipelineId, pipelineStageId, contactId, status, assignedTo, limit }) => {
    try {
      const data = await ghlGet("/opportunities/search", {
        location_id: locationId(),
        pipeline_id: pipelineId,
        pipeline_stage_id: pipelineStageId,
        contact_id: contactId,
        status,
        assigned_to: assignedTo,
        limit,
      });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_get_opportunity",
  "Obtiene el detalle de una oportunidad/deal por su ID.",
  { opportunityId: z.string() },
  async ({ opportunityId }) => {
    try {
      const data = await ghlGet(`/opportunities/${encodeURIComponent(opportunityId)}`);
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

// ---------- Workflows / Automatizaciones ----------

server.tool(
  "ghl_list_workflows",
  "Lista los workflows (automatizaciones) configurados en la sub-cuenta.",
  {},
  async () => {
    try {
      const data = await ghlGet("/workflows/", { locationId: locationId() });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

// ---------- Calendarios / Citas ----------

server.tool(
  "ghl_list_calendars",
  "Lista los calendarios configurados en la sub-cuenta.",
  {},
  async () => {
    try {
      const data = await ghlGet("/calendars/", { locationId: locationId() });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_list_appointments",
  "Lista citas/eventos de calendario en un rango de fechas. Acepta fechas en ISO 8601 (ej. 2026-09-18T00:00:00Z) o epoch en milisegundos.",
  {
    startTime: z.string().describe("Inicio del rango, ISO 8601 o epoch ms."),
    endTime: z.string().describe("Fin del rango, ISO 8601 o epoch ms."),
    calendarId: z.string().optional(),
    userId: z.string().optional().describe("Filtra por agente asignado."),
  },
  async ({ startTime, endTime, calendarId, userId }) => {
    try {
      const data = await ghlGet("/calendars/events", {
        locationId: locationId(),
        calendarId,
        userId,
        startTime: toEpochMillis(startTime),
        endTime: toEpochMillis(endTime),
      });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_get_appointment",
  "Obtiene el detalle de una cita específica por su eventId.",
  { eventId: z.string() },
  async ({ eventId }) => {
    try {
      const data = await ghlGet(`/calendars/events/appointments/${encodeURIComponent(eventId)}`);
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

// ---------- Conversaciones / Mensajes ----------

server.tool(
  "ghl_search_conversations",
  "Busca conversaciones (SMS, email, chat) de la sub-cuenta, opcionalmente filtradas por contacto.",
  {
    contactId: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async ({ contactId, limit }) => {
    try {
      const data = await ghlGet("/conversations/search", {
        locationId: locationId(),
        contactId,
        limit,
      });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_get_conversation_messages",
  "Obtiene los mensajes de una conversación específica.",
  {
    conversationId: z.string(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async ({ conversationId, limit }) => {
    try {
      const data = await ghlGet(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
        limit,
      });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

// ---------- Usuarios / Agentes ----------

server.tool(
  "ghl_list_users",
  "Lista los usuarios (agentes/equipo) con acceso a la sub-cuenta.",
  {},
  async () => {
    try {
      const data = await ghlGet("/users/", { locationId: locationId() });
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

server.tool(
  "ghl_get_user",
  "Obtiene el detalle de un usuario/agente por su ID.",
  { userId: z.string() },
  async ({ userId }) => {
    try {
      const data = await ghlGet(`/users/${encodeURIComponent(userId)}`);
      return asText(data);
    } catch (err) {
      return asError(err);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Error fatal iniciando el servidor MCP de GoHighLevel:", err);
  process.exit(1);
});
