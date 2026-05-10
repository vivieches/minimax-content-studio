import type {
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
  TextGenerationRequest,
  TextGenerationResult,
} from "../types";
import { extractModelIds, getModelForCapability, joinUrl, readError, requireApiKey, requireModel } from "../http";

function normalizeGeminiModel(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}

async function listModels(config: ProviderRuntimeConfig): Promise<string[]> {
  requireApiKey(config);
  const url = new URL(joinUrl(config.baseUrl, "/v1beta/models"));
  url.searchParams.set("key", config.apiKey);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return extractModelIds(await response.json());
}

export const geminiAdapter: ProviderAdapter = {
  async testConnection(config: ProviderRuntimeConfig): Promise<ProviderTestResult> {
    try {
      const models = await listModels(config);
      return { ok: true, models };
    } catch (error) {
      return {
        ok: false,
        models: [],
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  listModels,

  async generateText(
    request: TextGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<TextGenerationResult> {
    requireApiKey(config);
    const model = getModelForCapability(config, "text", request.model);
    requireModel(model, config);
    const modelPath = normalizeGeminiModel(model);
    const url = new URL(joinUrl(config.baseUrl, `/v1beta/${modelPath}:generateContent`));
    url.searchParams.set("key", config.apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.customHeaders,
      },
      body: JSON.stringify({
        systemInstruction: request.systemPrompt
          ? { parts: [{ text: request.systemPrompt }] }
          : undefined,
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 4096,
          temperature: request.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();
    const content = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts
          .map((part: Record<string, unknown>) => String(part.text ?? ""))
          .join("")
          .trim()
      : "";

    if (!content) {
      throw new Error("Gemini returned an empty text response.");
    }

    return { content, providerId: config.providerId, model, raw: data };
  },
};
