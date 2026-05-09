import { readDb, writeDb } from "./db";

export interface AppSettings {
  apiKey: string;
  apiKeyType: "pay_as_you_go" | "token_plan";
  baseUrl: string;
  textModel: string;
  textModelFast: string;
  imageModel: string;
  musicModel: string;
  videoModel: string;
  providerMode: "official-text-v2" | "openai-compatible" | "anthropic-compatible";
  demoMode: boolean;
  debugMode: boolean;
  exportDirectory: string;
  updatedAt: string;
}

const defaultSettings: AppSettings = {
  apiKey: "",
  apiKeyType: "pay_as_you_go",
  baseUrl: "https://api.minimax.io",
  textModel: "MiniMax-M2.7",
  textModelFast: "MiniMax-M2.7-highspeed",
  imageModel: "image-01",
  musicModel: "music-2.6",
  videoModel: "",
  providerMode: "official-text-v2",
  demoMode: false,
  debugMode: false,
  exportDirectory: "",
  updatedAt: new Date().toISOString(),
};

export async function getSettings(): Promise<AppSettings> {
  const envSettings: Partial<AppSettings> = {};
  if (process.env.MINIMAX_API_KEY) envSettings.apiKey = process.env.MINIMAX_API_KEY;
  if (process.env.MINIMAX_API_KEY_TYPE) envSettings.apiKeyType = process.env.MINIMAX_API_KEY_TYPE as AppSettings["apiKeyType"];
  if (process.env.MINIMAX_BASE_URL) envSettings.baseUrl = process.env.MINIMAX_BASE_URL;
  if (process.env.MINIMAX_TEXT_MODEL) envSettings.textModel = process.env.MINIMAX_TEXT_MODEL;
  if (process.env.MINIMAX_TEXT_MODEL_FAST) envSettings.textModelFast = process.env.MINIMAX_TEXT_MODEL_FAST;
  if (process.env.MINIMAX_IMAGE_MODEL) envSettings.imageModel = process.env.MINIMAX_IMAGE_MODEL;
  if (process.env.MINIMAX_MUSIC_MODEL) envSettings.musicModel = process.env.MINIMAX_MUSIC_MODEL;
  if (process.env.MINIMAX_VIDEO_MODEL) envSettings.videoModel = process.env.MINIMAX_VIDEO_MODEL;
  if (process.env.MINIMAX_PROVIDER_MODE) envSettings.providerMode = process.env.MINIMAX_PROVIDER_MODE as AppSettings["providerMode"];
  if (process.env.NEXT_PUBLIC_DEMO_MODE) envSettings.demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (process.env.MINIMAX_DEBUG_MODE) envSettings.debugMode = process.env.MINIMAX_DEBUG_MODE === "true";

  const fileSettings = await readDb<AppSettings>("settings.json", defaultSettings);

  return { ...defaultSettings, ...fileSettings, ...envSettings };
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readDb<AppSettings>("settings.json", defaultSettings);
  const updated: AppSettings = {
    ...current,
    ...partial,
    // Only overwrite the stored key if a non-empty value is explicitly provided.
    // An empty string means "user didn't re-enter the key", not "user wants to clear it".
    apiKey: partial.apiKey ? partial.apiKey : current.apiKey,
    updatedAt: new Date().toISOString(),
  };
  await writeDb("settings.json", updated);
  return updated;
}

export async function resetSettings(): Promise<AppSettings> {
  const current = await readDb<AppSettings>("settings.json", defaultSettings);
  const reset: AppSettings = {
    ...defaultSettings,
    apiKey: current.apiKey,
    updatedAt: new Date().toISOString(),
  };
  await writeDb("settings.json", reset);
  return reset;
}
