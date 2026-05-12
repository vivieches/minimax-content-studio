import { readDb, writeDb } from "@/lib/storage/db";
import { getAdapterForProvider } from "./registry";
import {
  getManifestsForCapability,
  getProviderManifest,
  providerManifests,
} from "./manifests";
import type {
  ActiveProviderCapability,
  ProviderCapability,
  ProviderManifest,
  ProviderRuntimeConfig,
  ProviderStoredConfig,
} from "./types";

export type ModelSource = "default" | "configured" | "manifest" | "discovered" | "cached";
export type ProviderIntegrationStatus = "integrated" | "unsupported" | "hidden";

export interface CatalogModel {
  id: string;
  label: string;
  capability: ProviderCapability;
  source: ModelSource;
  isDefault: boolean;
  isConfigured: boolean;
}

export interface ProviderCatalogItem extends ProviderManifest {
  integrationStatus: ProviderIntegrationStatus;
  active: boolean;
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  configuredModels: Partial<Record<ProviderCapability, string>>;
  modelsByCapability: Partial<Record<ProviderCapability, CatalogModel[]>>;
  modelCache?: {
    updatedAt: string;
    stale: boolean;
  };
}

export interface ModelCacheRecord {
  providerId: string;
  capability: ActiveProviderCapability;
  models: string[];
  updatedAt: string;
  baseUrl?: string;
}

export interface MediaCatalogProvider {
  id: string;
  name: string;
  description: string;
  integrated: boolean;
  active: boolean;
  hidden?: boolean;
  surface: "image" | "video" | "audio";
  defaultBaseUrl: string;
  docsUrl: string;
  models: string[];
  defaultModel: string;
  configured?: boolean;
  status: ProviderIntegrationStatus;
}

const MODEL_CACHE_FILE = "provider-model-cache.json";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const hiddenMediaProviders: MediaCatalogProvider[] = [
  {
    id: "volcengine",
    name: "Volcengine Ark (Doubao)",
    description: "Seedream/Seededit image models from the OpenDesign catalog.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "image",
    defaultBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    docsUrl: "https://www.volcengine.com/docs/82379",
    models: ["doubao-seedream-4-0-250828", "doubao-seededit-3-0-i2i-250628"],
    defaultModel: "doubao-seedream-4-0-250828",
    status: "hidden",
  },
  {
    id: "grok",
    name: "xAI Grok Imagine",
    description: "xAI image/video media provider from the OpenDesign catalog.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "image",
    defaultBaseUrl: "https://api.x.ai/v1",
    docsUrl: "https://docs.x.ai",
    models: ["grok-2-image", "grok-imagine"],
    defaultModel: "grok-2-image",
    status: "hidden",
  },
  {
    id: "nanobanana",
    name: "Google Nano Banana / Imagen",
    description: "Google image models from the OpenDesign catalog.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "image",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    docsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
    models: ["gemini-3.1-flash-image-preview", "imagen-4.0-generate-001", "imagen-3.0-generate-002"],
    defaultModel: "gemini-3.1-flash-image-preview",
    status: "hidden",
  },
  {
    id: "bfl",
    name: "Black Forest Labs",
    description: "FLUX API catalog entry.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "image",
    defaultBaseUrl: "https://api.bfl.ai",
    docsUrl: "https://docs.bfl.ai",
    models: ["flux-1.1-pro", "flux-pro", "flux-dev"],
    defaultModel: "flux-1.1-pro",
    status: "hidden",
  },
  {
    id: "suno",
    name: "Suno",
    description: "Music generation provider kept in the hidden media catalog.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "audio",
    defaultBaseUrl: "",
    docsUrl: "https://docs.suno.com",
    models: ["music-generation"],
    defaultModel: "music-generation",
    status: "hidden",
  },
  {
    id: "kling",
    name: "Kuaishou Kling",
    description: "Video generation provider kept in the hidden media catalog.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "video",
    defaultBaseUrl: "",
    docsUrl: "https://app.klingai.com",
    models: ["kling-1.6", "kling-2.0"],
    defaultModel: "kling-2.0",
    status: "hidden",
  },
  {
    id: "replicate-video",
    name: "Replicate Video",
    description: "Video models from Replicate kept hidden until video returns to the active product.",
    integrated: false,
    active: false,
    hidden: true,
    surface: "video",
    defaultBaseUrl: "https://api.replicate.com",
    docsUrl: "https://replicate.com/docs",
    models: ["bytedance/seedance-1-pro", "minimax/video-01"],
    defaultModel: "bytedance/seedance-1-pro",
    status: "hidden",
  },
];

export function listHiddenMediaProviders(): MediaCatalogProvider[] {
  return hiddenMediaProviders;
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

async function readModelCache(): Promise<ModelCacheRecord[]> {
  return readDb<ModelCacheRecord[]>(MODEL_CACHE_FILE, []);
}

async function writeModelCache(records: ModelCacheRecord[]) {
  await writeDb(MODEL_CACHE_FILE, records.slice(0, 200));
}

function modelCacheKey(record: Pick<ModelCacheRecord, "providerId" | "capability">) {
  return `${record.providerId}:${record.capability}`;
}

export async function getCachedProviderModels(
  providerId: string,
  capability: ActiveProviderCapability
): Promise<ModelCacheRecord | undefined> {
  const records = await readModelCache();
  return records.find((record) => record.providerId === providerId && record.capability === capability);
}

export async function saveProviderModelCache(record: Omit<ModelCacheRecord, "updatedAt"> & { updatedAt?: string }) {
  const records = await readModelCache();
  const key = modelCacheKey(record);
  const nextRecord: ModelCacheRecord = {
    ...record,
    models: unique(record.models),
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
  const next = [nextRecord, ...records.filter((item) => modelCacheKey(item) !== key)];
  await writeModelCache(next);
  return nextRecord;
}

export function catalogModelsForCapability(input: {
  manifest: ProviderManifest;
  capability: ProviderCapability;
  configured?: string;
  discovered?: string[];
  cached?: string[];
}): CatalogModel[] {
  const defaultModel = input.manifest.defaultModels[input.capability];
  const manifestModels = input.manifest.modelOptions?.[input.capability] ?? [];
  const rows: CatalogModel[] = [];
  const seen = new Set<string>();

  function push(id: string | undefined, source: ModelSource) {
    const model = id?.trim();
    if (!model || seen.has(model)) return;
    seen.add(model);
    rows.push({
      id: model,
      label: model,
      capability: input.capability,
      source,
      isDefault: model === defaultModel,
      isConfigured: model === input.configured,
    });
  }

  push(input.configured, "configured");
  push(defaultModel, "default");
  for (const model of input.discovered ?? []) push(model, "discovered");
  for (const model of input.cached ?? []) push(model, "cached");
  for (const model of manifestModels) push(model, "manifest");

  return rows;
}

export async function listProviderModels(input: {
  config: ProviderRuntimeConfig;
  capability: ActiveProviderCapability;
  refresh?: boolean;
}): Promise<{
  ok: boolean;
  models: string[];
  modelsDetailed: CatalogModel[];
  source: "live" | "cache" | "manifest";
  manual: boolean;
  stale: boolean;
  error?: string;
}> {
  const cached = await getCachedProviderModels(input.config.providerId, input.capability);
  const cachedFresh = cached ? Date.now() - Date.parse(cached.updatedAt) <= CACHE_TTL_MS : false;
  const adapter = getAdapterForProvider(input.config.providerId);
  const canDiscover = input.config.manifest.modelDiscovery && Boolean(adapter.listModels);
  const configured = input.config.models[input.capability];

  if (canDiscover && (input.refresh || !cachedFresh)) {
    try {
      const liveModels = await adapter.listModels?.(input.config);
      const saved = await saveProviderModelCache({
        providerId: input.config.providerId,
        capability: input.capability,
        models: liveModels ?? [],
        baseUrl: input.config.baseUrl,
      });
      const modelsDetailed = catalogModelsForCapability({
        manifest: input.config.manifest,
        capability: input.capability,
        configured,
        discovered: saved.models,
      });
      return {
        ok: true,
        models: modelsDetailed.map((model) => model.id),
        modelsDetailed,
        source: "live",
        manual: false,
        stale: false,
      };
    } catch (error) {
      if (cached) {
        const modelsDetailed = catalogModelsForCapability({
          manifest: input.config.manifest,
          capability: input.capability,
          configured,
          cached: cached.models,
        });
        return {
          ok: false,
          models: modelsDetailed.map((model) => model.id),
          modelsDetailed,
          source: "cache",
          manual: false,
          stale: true,
          error: error instanceof Error ? error.message : "Failed to list live models",
        };
      }
      const fallbackModels = catalogModelsForCapability({
        manifest: input.config.manifest,
        capability: input.capability,
        configured,
      });
      return {
        ok: false,
        models: fallbackModels.map((model) => model.id),
        modelsDetailed: fallbackModels,
        source: "manifest",
        manual: !canDiscover,
        stale: false,
        error: error instanceof Error ? error.message : "Failed to list live models",
      };
    }
  }

  const modelsDetailed = catalogModelsForCapability({
    manifest: input.config.manifest,
    capability: input.capability,
    configured,
    cached: cached?.models,
  });
  return {
    ok: true,
    models: modelsDetailed.map((model) => model.id),
    modelsDetailed,
    source: cached ? "cache" : "manifest",
    manual: !canDiscover,
    stale: cached ? !cachedFresh : false,
  };
}

export async function buildProviderCatalog(input: {
  providers: Record<string, ProviderStoredConfig>;
  includeHidden?: boolean;
}): Promise<ProviderCatalogItem[]> {
  const cache = await readModelCache();
  return providerManifests
    .filter((manifest) => input.includeHidden || !manifest.tags?.includes("hidden"))
    .map((manifest) => {
      const config = input.providers[manifest.id];
      const configuredModels = config?.models ?? {};
      const modelsByCapability = Object.fromEntries(
        manifest.capabilities.map((capability) => {
          const cacheRecord =
            capability === "text" || capability === "image"
              ? cache.find((record) => record.providerId === manifest.id && record.capability === capability)
              : undefined;
          return [
            capability,
            catalogModelsForCapability({
              manifest,
              capability,
              configured: configuredModels[capability],
              cached: cacheRecord?.models,
            }),
          ];
        })
      ) as Partial<Record<ProviderCapability, CatalogModel[]>>;
      const hasApiKey = Boolean(config?.apiKey?.trim());
      return {
        ...manifest,
        integrationStatus: "integrated",
        active: manifest.capabilities.includes("text") || manifest.capabilities.includes("image"),
        enabled: Boolean(config?.enabled),
        configured: Boolean(config?.enabled && (hasApiKey || manifest.authHeader === "none")),
        hasApiKey,
        configuredModels,
        modelsByCapability,
        modelCache: cache.some((record) => record.providerId === manifest.id)
          ? {
              updatedAt: cache.find((record) => record.providerId === manifest.id)?.updatedAt ?? "",
              stale: cache.some((record) => record.providerId === manifest.id && Date.now() - Date.parse(record.updatedAt) > CACHE_TTL_MS),
            }
          : undefined,
      };
    });
}

export async function buildMediaCatalog(input: {
  providers: Record<string, ProviderStoredConfig>;
  includeHidden?: boolean;
}): Promise<MediaCatalogProvider[]> {
  const imageProviders = (await buildProviderCatalog({ providers: input.providers }))
    .filter((provider) => provider.capabilities.includes("image"))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      integrated: true,
      active: true,
      surface: "image" as const,
      defaultBaseUrl: provider.defaultBaseUrl,
      docsUrl: provider.docsUrl,
      models: (provider.modelsByCapability.image ?? []).map((model) => model.id),
      defaultModel: provider.defaultModels.image ?? "",
      configured: provider.configured,
      status: "integrated" as ProviderIntegrationStatus,
    }));

  return input.includeHidden ? [...imageProviders, ...hiddenMediaProviders] : imageProviders;
}

export function findImageProviderByModel(model: string): string | undefined {
  const active = getManifestsForCapability("image").find((manifest) => {
    const options = catalogModelsForCapability({ manifest, capability: "image" }).map((item) => item.id);
    return options.includes(model);
  })?.id;
  if (active) return active;
  return hiddenMediaProviders.find((provider) => provider.surface === "image" && provider.models.includes(model))?.id;
}

export function getMediaCatalogProvider(providerId: string): MediaCatalogProvider | undefined {
  const manifest = getProviderManifest(providerId);
  if (manifest?.capabilities.includes("image")) {
    return {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      integrated: true,
      active: true,
      surface: "image",
      defaultBaseUrl: manifest.defaultBaseUrl,
      docsUrl: manifest.docsUrl,
      models: catalogModelsForCapability({ manifest, capability: "image" }).map((model) => model.id),
      defaultModel: manifest.defaultModels.image ?? "",
      status: "integrated",
    };
  }
  return hiddenMediaProviders.find((provider) => provider.id === providerId);
}

export function getProviderCapabilityOrDefault(providerId: string): ActiveProviderCapability | undefined {
  const manifest = getProviderManifest(providerId);
  return manifest?.capabilities.find((item): item is ActiveProviderCapability => item === "text" || item === "image");
}
