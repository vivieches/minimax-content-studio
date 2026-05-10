import { getResolvedConfig, createMiniMaxHeaders } from "./config";
import { classifyMiniMaxError, MiniMaxError } from "./errors";

export async function testConnection(): Promise<{ ok: boolean; models: string[]; error?: string }> {
  const config = await getResolvedConfig();

  if (!config.apiKey) {
    return { ok: false, models: [], error: "API Key not configured. Please set MINIMAX_API_KEY in Settings." };
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/models`, {
      method: "GET",
      headers: createMiniMaxHeaders(config),
    });

    if (!response.ok) {
      const body = await response.text();
      const err = classifyMiniMaxError(response.status, body);
      return { ok: false, models: [], error: err.message };
    }

    const data = await response.json();
    const models = extractModelList(data);

    return { ok: true, models };
  } catch (error) {
    return {
      ok: false,
      models: [],
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function listModels(): Promise<string[]> {
  const config = await getResolvedConfig();
  const response = await fetch(`${config.baseUrl}/v1/models`, {
    method: "GET",
    headers: createMiniMaxHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw classifyMiniMaxError(response.status, body);
  }

  const data = await response.json();
  return extractModelList(data);
}

function extractModelList(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];

  const d = data as Record<string, unknown>;
  const dataField = d.data;
  const modelsField = d.models;

  if (Array.isArray(dataField)) {
    return dataField
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const m = item as Record<string, unknown>;
          return (m.id ?? m.model ?? m.name ?? "") as string;
        }
        return "";
      })
      .filter(Boolean);
  }

  if (Array.isArray(modelsField)) {
    return modelsField
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const m = item as Record<string, unknown>;
          return (m.id ?? m.model ?? m.name ?? "") as string;
        }
        return "";
      })
      .filter(Boolean);
  }

  return [];
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/** Checks both env var and the persisted settings file for demo mode. */
export async function isEffectiveDemoMode(): Promise<boolean> {
  if (isDemoMode()) return true;
  try {
    const { getSettings } = await import("@/lib/storage/settings");
    const settings = await getSettings();
    return settings.demoMode === true;
  } catch {
    return false;
  }
}

export async function validateConfigOrThrow(): Promise<void> {
  const config = await getResolvedConfig();
  if (!config.apiKey && !(await isEffectiveDemoMode())) {
    throw new MiniMaxError("MINIMAX_API_KEY is not configured. Please go to Settings to add your API key.", 401);
  }
}
