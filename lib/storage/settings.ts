import { providerManifests, createDefaultProviderConfig } from "@/lib/providers/manifests";
import type { ActiveProviderCapability, ProviderDefaults, ProviderStoredConfig } from "@/lib/providers/types";
import { sanitizeAgentCliEnv } from "@/lib/daemon/agentConfig";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/locales";
import { readDb, writeDb } from "./db";

export interface AppSettings {
  providers: Record<string, ProviderStoredConfig>;
  defaults: ProviderDefaults;
  executionMode: "cli" | "byok";
  agentId: string | null;
  agentModels: Record<string, { model?: string; reasoning?: string }>;
  agentCliEnv: Record<string, Record<string, string>>;
  demoMode: boolean;
  debugMode: boolean;
  exportDirectory: string;
  language: Locale;
  updatedAt: string;
}

type LegacySettings = Partial<AppSettings> & {
  apiKey?: string;
  apiKeyType?: "pay_as_you_go" | "token_plan";
  baseUrl?: string;
  textModel?: string;
  textModelFast?: string;
  imageModel?: string;
  musicModel?: string;
  videoModel?: string;
  providerMode?: "official-text-v2" | "openai-compatible" | "anthropic-compatible";
};

const capabilityDefaults: ProviderDefaults = {
  text: { providerId: "minimax", model: "MiniMax-M2.7" },
  image: { providerId: "minimax", model: "image-01" },
};

const envKeyMap: Record<string, string | undefined> = {
  minimax: process.env.MINIMAX_API_KEY,
  "openai-compatible": process.env.OPENAI_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,
  groq: process.env.GROQ_API_KEY,
  together: process.env.TOGETHER_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  fal: process.env.FAL_KEY,
  pollinations: process.env.POLLINATIONS_API_KEY,
  replicate: process.env.REPLICATE_API_TOKEN,
  openai: process.env.OPENAI_API_KEY,
  "azure-openai": process.env.AZURE_OPENAI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  ollama: process.env.OLLAMA_API_KEY,
  "lm-studio": process.env.LM_STUDIO_API_KEY,
  vllm: process.env.VLLM_API_KEY,
  "local-openai": process.env.LOCAL_OPENAI_API_KEY,
};

const envBaseUrlMap: Record<string, string | undefined> = {
  minimax: process.env.MINIMAX_BASE_URL,
  "openai-compatible": process.env.OPENAI_BASE_URL,
  openrouter: process.env.OPENROUTER_BASE_URL,
  groq: process.env.GROQ_BASE_URL,
  together: process.env.TOGETHER_BASE_URL,
  anthropic: process.env.ANTHROPIC_BASE_URL,
  gemini: process.env.GEMINI_BASE_URL,
  fal: process.env.FAL_BASE_URL,
  pollinations: process.env.POLLINATIONS_BASE_URL,
  replicate: process.env.REPLICATE_BASE_URL,
  openai: process.env.OPENAI_BASE_URL,
  "azure-openai": process.env.AZURE_OPENAI_BASE_URL,
  deepseek: process.env.DEEPSEEK_BASE_URL,
  ollama: process.env.OLLAMA_BASE_URL,
  "lm-studio": process.env.LM_STUDIO_BASE_URL,
  vllm: process.env.VLLM_BASE_URL,
  "local-openai": process.env.LOCAL_OPENAI_BASE_URL,
};

function defaultProviders(): Record<string, ProviderStoredConfig> {
  return Object.fromEntries(
    providerManifests.map((manifest) => [manifest.id, createDefaultProviderConfig(manifest)])
  );
}

function mergeProviderConfig(
  base: ProviderStoredConfig,
  incoming?: Partial<ProviderStoredConfig>
): ProviderStoredConfig {
  return {
    ...base,
    ...incoming,
    apiKey: incoming?.apiKey ? incoming.apiKey : base.apiKey,
    baseUrl: incoming?.baseUrl || base.baseUrl,
    models: {
      ...base.models,
      ...incoming?.models,
    },
    customHeaders: {
      ...base.customHeaders,
      ...incoming?.customHeaders,
    },
    extra: {
      ...base.extra,
      ...incoming?.extra,
    },
  };
}

function normalizeCapabilityDefault(
  capability: ActiveProviderCapability,
  defaults: ProviderDefaults,
  providers: Record<string, ProviderStoredConfig>
): ProviderDefaults[ActiveProviderCapability] {
  const selected = defaults[capability] ?? capabilityDefaults[capability];
  const provider = providers[selected.providerId] ? selected.providerId : capabilityDefaults[capability].providerId;
  const model =
    selected.model ||
    providers[provider]?.models[capability] ||
    capabilityDefaults[capability].model ||
    "";
  return { providerId: provider, model };
}

function migrateSettings(fileSettings: LegacySettings): AppSettings {
  const providers = defaultProviders();

  if (fileSettings.providers) {
    for (const [providerId, config] of Object.entries(fileSettings.providers)) {
      if (!providers[providerId]) continue;
      providers[providerId] = mergeProviderConfig(providers[providerId], config);
    }
  }

  if (fileSettings.apiKey || fileSettings.baseUrl || fileSettings.textModel || fileSettings.imageModel) {
    providers.minimax = mergeProviderConfig(providers.minimax, {
      enabled: true,
      apiKey: fileSettings.apiKey,
      baseUrl: fileSettings.baseUrl,
      models: {
        text: fileSettings.textModel,
        image: fileSettings.imageModel,
        audio: fileSettings.musicModel,
        video: fileSettings.videoModel,
      },
    });
  }

  for (const manifest of providerManifests) {
    const envKey = envKeyMap[manifest.id];
    const envBaseUrl = envBaseUrlMap[manifest.id];
    if (!providers[manifest.id]) continue;

    providers[manifest.id] = mergeProviderConfig(providers[manifest.id], {
      enabled: providers[manifest.id].enabled || Boolean(envKey),
      apiKey: envKey || undefined,
      baseUrl: envBaseUrl,
      models: {
        text: manifest.id === "minimax" ? process.env.MINIMAX_TEXT_MODEL : undefined,
        image: manifest.id === "minimax" ? process.env.MINIMAX_IMAGE_MODEL : undefined,
      },
    });
  }

  const incomingDefaults = fileSettings.defaults ?? capabilityDefaults;
  const defaults: ProviderDefaults = {
    text: normalizeCapabilityDefault("text", incomingDefaults, providers),
    image: normalizeCapabilityDefault("image", incomingDefaults, providers),
  };

  return {
    providers,
    defaults,
    executionMode: fileSettings.executionMode ?? "byok",
    agentId: fileSettings.agentId ?? null,
    agentModels: fileSettings.agentModels ?? {},
    agentCliEnv: sanitizeAgentCliEnv(fileSettings.agentCliEnv),
    demoMode:
      process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      fileSettings.demoMode === true,
    debugMode:
      process.env.OPEN_STUDIO_DEBUG_MODE === "true" ||
      process.env.MINIMAX_DEBUG_MODE === "true" ||
      fileSettings.debugMode === true,
    exportDirectory: fileSettings.exportDirectory ?? "",
    language: normalizeLocale(fileSettings.language ?? DEFAULT_LOCALE),
    updatedAt: fileSettings.updatedAt ?? new Date().toISOString(),
  };
}

function mergeSettings(current: AppSettings, partial: Partial<AppSettings>): AppSettings {
  const providers = { ...current.providers };

  if (partial.providers) {
    for (const [providerId, config] of Object.entries(partial.providers)) {
      if (!providers[providerId]) continue;
      providers[providerId] = mergeProviderConfig(providers[providerId], config);
    }
  }

  const defaults: ProviderDefaults = {
    ...current.defaults,
    ...partial.defaults,
  };

  return {
    ...current,
    ...partial,
    providers,
    defaults: {
      text: normalizeCapabilityDefault("text", defaults, providers),
      image: normalizeCapabilityDefault("image", defaults, providers),
    },
    executionMode: partial.executionMode ?? current.executionMode,
    agentId: partial.agentId === undefined ? current.agentId : partial.agentId,
    agentModels: partial.agentModels ? { ...current.agentModels, ...partial.agentModels } : current.agentModels,
    agentCliEnv: partial.agentCliEnv === undefined ? current.agentCliEnv : sanitizeAgentCliEnv(partial.agentCliEnv),
    updatedAt: new Date().toISOString(),
  };
}

export function getDefaultSettings(): AppSettings {
  return migrateSettings({});
}

export async function getSettings(): Promise<AppSettings> {
  const fileSettings = await readDb<LegacySettings>("settings.json", getDefaultSettings());
  return migrateSettings(fileSettings);
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = mergeSettings(current, partial);
  await writeDb("settings.json", updated);
  return updated;
}

export async function resetSettings(): Promise<AppSettings> {
  const current = await getSettings();
  const reset = getDefaultSettings();

  for (const [providerId, config] of Object.entries(current.providers)) {
    if (!reset.providers[providerId]) continue;
    reset.providers[providerId].apiKey = config.apiKey;
    reset.providers[providerId].enabled = config.enabled;
  }

  reset.updatedAt = new Date().toISOString();
  await writeDb("settings.json", reset);
  return reset;
}
