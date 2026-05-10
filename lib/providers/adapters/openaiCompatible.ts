import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
  TextGenerationRequest,
  TextGenerationResult,
} from "../types";
import {
  aspectRatioToOpenAISize,
  createBearerHeaders,
  extractModelIds,
  joinUrl,
  readError,
  requireApiKey,
  requireModel,
  getModelForCapability,
} from "../http";

async function listModels(config: ProviderRuntimeConfig): Promise<string[]> {
  requireApiKey(config);
  const response = await fetch(joinUrl(config.baseUrl, "/models"), {
    headers: createBearerHeaders(config),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return extractModelIds(await response.json());
}

export const openAICompatibleAdapter: ProviderAdapter = {
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

    const messages = [
      request.systemPrompt ? { role: "system", content: request.systemPrompt } : null,
      { role: "user", content: request.prompt },
    ].filter(Boolean);

    const response = await fetch(joinUrl(config.baseUrl, "/chat/completions"), {
      method: "POST",
      headers: createBearerHeaders(config),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`${config.manifest.name} returned an empty text response.`);
    }

    return { content: content.trim(), providerId: config.providerId, model, raw: data };
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    requireApiKey(config);
    const model = getModelForCapability(config, "image", request.model);
    requireModel(model, config);

    const response = await fetch(joinUrl(config.baseUrl, "/images/generations"), {
      method: "POST",
      headers: createBearerHeaders(config),
      body: JSON.stringify({
        model,
        prompt: request.prompt,
        n: request.n ?? 1,
        size: aspectRatioToOpenAISize(request.aspectRatio),
      }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();
    const items = Array.isArray(data?.data) ? data.data : [];
    const urls = items
      .map((item: Record<string, unknown>) => String(item.url ?? ""))
      .filter(Boolean);
    const base64s = items
      .map((item: Record<string, unknown>) => String(item.b64_json ?? ""))
      .filter(Boolean);

    return {
      urls,
      base64s,
      finalPrompt: request.prompt,
      providerId: config.providerId,
      model,
      raw: data,
    };
  },
};
