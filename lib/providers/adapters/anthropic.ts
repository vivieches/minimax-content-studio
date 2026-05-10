import type {
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
  TextGenerationRequest,
  TextGenerationResult,
} from "../types";
import { extractModelIds, getModelForCapability, joinUrl, readError, requireApiKey, requireModel } from "../http";

function headers(config: ProviderRuntimeConfig): Record<string, string> {
  return {
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
    ...config.customHeaders,
  };
}

async function listModels(config: ProviderRuntimeConfig): Promise<string[]> {
  requireApiKey(config);
  const response = await fetch(joinUrl(config.baseUrl, "/v1/models"), {
    headers: headers(config),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return extractModelIds(await response.json());
}

export const anthropicAdapter: ProviderAdapter = {
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

    const response = await fetch(joinUrl(config.baseUrl, "/v1/messages"), {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();
    const content = Array.isArray(data?.content)
      ? data.content
          .map((part: Record<string, unknown>) => (part.type === "text" ? String(part.text ?? "") : ""))
          .join("")
          .trim()
      : "";

    if (!content) {
      throw new Error("Anthropic returned an empty text response.");
    }

    return { content, providerId: config.providerId, model, raw: data };
  },
};
