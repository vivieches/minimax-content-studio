import type { ProviderRuntimeConfig } from "./types";

export function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

export function createBearerHeaders(config: ProviderRuntimeConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    ...config.customHeaders,
  };
}

export async function readError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 800);
  } catch {
    return response.statusText || "Unknown provider error";
  }
}

export function extractModelIds(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const candidates = [record.data, record.models];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const model = item as Record<string, unknown>;
          return String(model.id ?? model.model ?? model.name ?? "").replace(/^models\//, "");
        }
        return "";
      })
      .filter(Boolean);
  }

  return [];
}

export function extractUrls(data: unknown): string[] {
  const urls = new Set<string>();

  function walk(value: unknown): void {
    if (!value) return;
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value) || /^data:/i.test(value)) urls.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  }

  walk(data);
  return Array.from(urls);
}

export function getModelForCapability(
  config: ProviderRuntimeConfig,
  capability: "text" | "image" | "audio" | "video",
  override?: string
): string {
  return override || config.models[capability] || config.manifest.defaultModels[capability] || "";
}

export function requireApiKey(config: ProviderRuntimeConfig): void {
  if (!config.apiKey) {
    throw new Error(`${config.manifest.name} API key is not configured.`);
  }
}

export function requireModel(model: string, config: ProviderRuntimeConfig): void {
  if (!model.trim()) {
    throw new Error(`${config.manifest.name} model is not configured.`);
  }
}

export function toDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export function aspectRatioToOpenAISize(aspectRatio?: string): string {
  if (aspectRatio === "1:1") return "1024x1024";
  if (aspectRatio === "9:16") return "1024x1536";
  return "1536x1024";
}
