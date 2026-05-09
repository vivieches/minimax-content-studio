export type ProviderMode = "official-text-v2" | "openai-compatible" | "anthropic-compatible";
export type ApiKeyType = "pay_as_you_go" | "token_plan";

export interface MiniMaxConfig {
  apiKey: string;
  apiKeyType: ApiKeyType;
  baseUrl: string;
  textModel: string;
  textModelFast: string;
  imageModel: string;
  musicModel: string;
  videoModel: string;
  providerMode: ProviderMode;
}

export function getMiniMaxConfig(): MiniMaxConfig {
  return {
    apiKey: process.env.MINIMAX_API_KEY ?? "",
    apiKeyType: (process.env.MINIMAX_API_KEY_TYPE as ApiKeyType) ?? "pay_as_you_go",
    baseUrl: process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io",
    textModel: process.env.MINIMAX_TEXT_MODEL ?? "MiniMax-M2.7",
    textModelFast: process.env.MINIMAX_TEXT_MODEL_FAST ?? "MiniMax-M2.7-highspeed",
    imageModel: process.env.MINIMAX_IMAGE_MODEL ?? "image-01",
    musicModel: process.env.MINIMAX_MUSIC_MODEL ?? "music-2.6",
    videoModel: process.env.MINIMAX_VIDEO_MODEL ?? "",
    providerMode: (process.env.MINIMAX_PROVIDER_MODE as ProviderMode) ?? "official-text-v2",
  };
}

function envOrFile(envValue: string | undefined, fileValue: string | undefined, fallback: string): string {
  return envValue && envValue.trim() ? envValue : fileValue || fallback;
}

/**
 * Returns the effective config by merging env vars (highest priority) with
 * persisted settings from data/settings.json (set via the Settings UI).
 * Use this in all API route handlers instead of getMiniMaxConfig().
 */
export async function getResolvedConfig(): Promise<MiniMaxConfig> {
  try {
    const { readDb } = await import("@/lib/storage/db");
    const file = await readDb<Partial<MiniMaxConfig & { demoMode?: boolean }>>("settings.json", {});
    return {
      apiKey: envOrFile(process.env.MINIMAX_API_KEY, file.apiKey, ""),
      apiKeyType: (process.env.MINIMAX_API_KEY_TYPE as ApiKeyType | undefined) ?? file.apiKeyType ?? "pay_as_you_go",
      baseUrl: envOrFile(process.env.MINIMAX_BASE_URL, file.baseUrl, "https://api.minimax.io"),
      textModel: envOrFile(process.env.MINIMAX_TEXT_MODEL, file.textModel, "MiniMax-M2.7"),
      textModelFast: envOrFile(process.env.MINIMAX_TEXT_MODEL_FAST, file.textModelFast, "MiniMax-M2.7-highspeed"),
      imageModel: envOrFile(process.env.MINIMAX_IMAGE_MODEL, file.imageModel, "image-01"),
      musicModel: envOrFile(process.env.MINIMAX_MUSIC_MODEL, file.musicModel, "music-2.6"),
      videoModel: envOrFile(process.env.MINIMAX_VIDEO_MODEL, file.videoModel, ""),
      providerMode: (process.env.MINIMAX_PROVIDER_MODE as ProviderMode | undefined) ?? file.providerMode ?? "official-text-v2",
    };
  } catch {
    return getMiniMaxConfig();
  }
}

export function createMiniMaxHeaders(config?: MiniMaxConfig): Record<string, string> {
  const c = config ?? getMiniMaxConfig();
  return {
    Authorization: `Bearer ${c.apiKey}`,
    "Content-Type": "application/json",
  };
}
