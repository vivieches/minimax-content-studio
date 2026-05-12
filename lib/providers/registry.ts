import { anthropicAdapter } from "./adapters/anthropic";
import { elevenLabsAdapter } from "./adapters/elevenlabs";
import { falAdapter } from "./adapters/fal";
import { geminiAdapter } from "./adapters/gemini";
import { minimaxAdapter } from "./adapters/minimax";
import { openAICompatibleAdapter } from "./adapters/openaiCompatible";
import { pollinationsAdapter } from "./adapters/pollinations";
import { replicateAdapter } from "./adapters/replicate";
import { stubAdapter } from "./adapters/stub";
import { getProviderManifest, providerManifests } from "./manifests";
import type { ProviderAdapter, ProviderCapability, ProviderManifest } from "./types";

const adapters: Record<string, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  elevenlabs: elevenLabsAdapter,
  fal: falAdapter,
  gemini: geminiAdapter,
  minimax: minimaxAdapter,
  "openai-compatible": openAICompatibleAdapter,
  pollinations: pollinationsAdapter,
  replicate: replicateAdapter,
  stub: stubAdapter,
};

export function listProviderManifests(): ProviderManifest[] {
  return providerManifests;
}

export function getAdapterForProvider(providerId: string): ProviderAdapter {
  const manifest = getProviderManifest(providerId);
  if (!manifest) {
    throw new Error(`Unknown provider "${providerId}".`);
  }

  const adapter = adapters[manifest.adapterId];
  if (!adapter) {
    throw new Error(`Provider "${manifest.name}" does not have an adapter.`);
  }

  return adapter;
}

export function assertProviderCapability(providerId: string, capability: ProviderCapability): void {
  const manifest = getProviderManifest(providerId);
  if (!manifest) {
    throw new Error(`Unknown provider "${providerId}".`);
  }
  if (!manifest.capabilities.includes(capability)) {
    throw new Error(`${manifest.name} does not support ${capability} generation.`);
  }
}
