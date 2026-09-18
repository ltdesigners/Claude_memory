const BASE_URL = process.env.GHL_BASE_URL ?? "https://services.leadconnectorhq.com";
const API_VERSION = process.env.GHL_API_VERSION ?? "2021-07-28";
const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

export function requireConfig(): { apiKey: string; locationId: string } {
  if (!API_KEY) {
    throw new Error(
      "Falta GHL_API_KEY. Define la API Key privada de GoHighLevel como variable de entorno."
    );
  }
  if (!LOCATION_ID) {
    throw new Error(
      "Falta GHL_LOCATION_ID. Define el Location ID de GoHighLevel como variable de entorno."
    );
  }
  return { apiKey: API_KEY, locationId: LOCATION_ID };
}

export class GhlApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`GoHighLevel API error ${status}: ${JSON.stringify(body)}`);
  }
}

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function ghlGet<T = unknown>(path: string, query?: Query): Promise<T> {
  const { apiKey } = requireConfig();
  const res = await fetch(buildUrl(path, query), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: API_VERSION,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new GhlApiError(res.status, body);
  }

  return body as T;
}

/** Convierte una fecha ISO (o un epoch en milisegundos ya como string) al formato que espera la API de calendario. */
export function toEpochMillis(value: string): number {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error(`Fecha inválida: "${value}". Usa formato ISO 8601 (ej. 2026-09-18T00:00:00Z) o epoch en milisegundos.`);
  }
  return ms;
}

export const locationId = () => requireConfig().locationId;
