import { describe, expect, it } from "vitest";
import { createDefaultProviderConfig } from "@/lib/providers/manifests";
import type { AppSettings } from "@/lib/storage/settings";
import { evaluateTextFallback } from "./fallback";

function settings(partial: Partial<AppSettings>): Pick<AppSettings, "defaults" | "providers"> {
  return {
    defaults: {
      text: { providerId: "openai", model: "gpt-5.1" },
      image: { providerId: "openai", model: "gpt-image-1" },
    },
    providers: {},
    ...partial,
  };
}

describe("text fallback planner", () => {
  it("accepts configured BYOK text providers", () => {
    const openai = createDefaultProviderConfig({
      id: "openai",
      adapterId: "openai-compatible",
      name: "OpenAI",
      description: "",
      capabilities: ["text", "image"],
      defaultBaseUrl: "https://api.openai.com/v1",
      defaultModels: { text: "gpt-5.1" },
      modelDiscovery: true,
      docsUrl: "",
      authHeader: "bearer",
      requiresModelFor: ["text", "image"],
    });

    const plan = evaluateTextFallback(
      settings({
        providers: {
          openai: { ...openai, enabled: true, apiKey: "sk-test" },
        },
      })
    );

    expect(plan).toMatchObject({
      available: true,
      providerId: "openai",
      model: "gpt-5.1",
    });
  });

  it("rejects fallback when the provider has no API key", () => {
    const plan = evaluateTextFallback(
      settings({
        providers: {
          openai: {
            enabled: true,
            apiKey: "",
            baseUrl: "https://api.openai.com/v1",
            models: { text: "gpt-5.1" },
          },
        },
      })
    );

    expect(plan.available).toBe(false);
    if (!plan.available) {
      expect(plan.reason).toMatch(/API key/i);
      expect(plan.diagnostic.kind).toBe("fallback_unavailable");
    }
  });

  it("rejects providers without text support", () => {
    const plan = evaluateTextFallback(
      settings({
        defaults: {
          text: { providerId: "fal", model: "fal-ai/flux/dev" },
          image: { providerId: "fal", model: "fal-ai/flux/dev" },
        },
        providers: {
          fal: {
            enabled: true,
            apiKey: "fal-key",
            baseUrl: "https://fal.run",
            models: { image: "fal-ai/flux/dev" },
          },
        },
      })
    );

    expect(plan.available).toBe(false);
    if (!plan.available) expect(plan.reason).toMatch(/não suporta/i);
  });
});
