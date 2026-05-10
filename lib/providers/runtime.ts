import { getSettings } from "@/lib/storage/settings";
import { getProviderManifest } from "./manifests";
import type { ProviderCapability, ProviderRuntimeConfig } from "./types";

export interface ProviderOverride {
  providerId?: string;
  model?: string;
}

export async function resolveProviderConfig(
  capability: ProviderCapability,
  override?: ProviderOverride
): Promise<ProviderRuntimeConfig> {
  const settings = await getSettings();
  const defaultChoice = settings.defaults[capability];
  const providerId = override?.providerId || defaultChoice.providerId;
  const manifest = getProviderManifest(providerId);

  if (!manifest) {
    throw new Error(`Unknown provider "${providerId}".`);
  }

  if (!manifest.capabilities.includes(capability)) {
    throw new Error(`${manifest.name} does not support ${capability} generation.`);
  }

  const stored = settings.providers[providerId];
  if (!stored) {
    throw new Error(`${manifest.name} is not configured.`);
  }

  return {
    ...stored,
    providerId,
    manifest,
    models: {
      ...manifest.defaultModels,
      ...stored.models,
      [capability]: override?.model || stored.models[capability] || defaultChoice.model || manifest.defaultModels[capability],
    },
  };
}

export async function isDemoModeEnabled(): Promise<boolean> {
  const settings = await getSettings();
  return settings.demoMode;
}
