import { describe, expect, it } from "vitest";
import { createDefaultProviderConfig, getProviderManifest } from "./manifests";
import {
  buildMediaCatalog,
  buildProviderCatalog,
  catalogModelsForCapability,
  findImageProviderByModel,
  getCachedProviderModels,
  saveProviderModelCache,
} from "./modelCatalog";

describe("provider model catalog", () => {
  it("builds de-duped model options from configured, default, cached and manifest sources", () => {
    const manifest = getProviderManifest("openai");
    expect(manifest).toBeTruthy();
    const models = catalogModelsForCapability({
      manifest: manifest!,
      capability: "text",
      configured: "custom-gpt",
      cached: ["gpt-5.1", "custom-gpt"],
    });

    expect(models[0]).toMatchObject({ id: "custom-gpt", source: "configured", isConfigured: true });
    expect(models.map((model) => model.id).filter((id) => id === "custom-gpt")).toHaveLength(1);
    expect(models.some((model) => model.id === manifest!.defaultModels.text && model.isDefault)).toBe(true);
  });

  it("persists live model cache and exposes it in the provider catalog", async () => {
    await saveProviderModelCache({
      providerId: "openai",
      capability: "text",
      models: ["gpt-live-a", "gpt-live-b"],
      baseUrl: "https://api.openai.com/v1",
    });

    const cached = await getCachedProviderModels("openai", "text");
    expect(cached?.models).toEqual(["gpt-live-a", "gpt-live-b"]);

    const openai = getProviderManifest("openai")!;
    const catalog = await buildProviderCatalog({
      providers: {
        openai: { ...createDefaultProviderConfig(openai), enabled: true, apiKey: "sk-test" },
      },
    });
    const provider = catalog.find((item) => item.id === "openai");
    expect(provider?.modelsByCapability.text?.map((model) => model.id)).toContain("gpt-live-a");
    expect(provider?.configured).toBe(true);
  });

  it("keeps hidden video/audio media providers out unless requested", async () => {
    const visible = await buildMediaCatalog({ providers: {}, includeHidden: false });
    const hidden = await buildMediaCatalog({ providers: {}, includeHidden: true });

    expect(visible.some((provider) => provider.surface === "video" || provider.surface === "audio")).toBe(false);
    expect(hidden.some((provider) => provider.surface === "video")).toBe(true);
    expect(hidden.some((provider) => provider.surface === "audio")).toBe(true);
  });

  it("resolves image providers by model through the central catalog", () => {
    expect(findImageProviderByModel("fal-ai/flux/schnell")).toBe("fal");
    expect(findImageProviderByModel("black-forest-labs/flux-schnell")).toBe("replicate");
  });
});
