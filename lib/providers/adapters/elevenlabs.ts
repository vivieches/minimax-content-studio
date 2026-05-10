import type {
  AudioGenerationRequest,
  AudioGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
} from "../types";
import { extractModelIds, getModelForCapability, joinUrl, readError, requireApiKey, requireModel, toDataUrl } from "../http";

function headers(config: ProviderRuntimeConfig): Record<string, string> {
  return {
    "xi-api-key": config.apiKey,
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

export const elevenLabsAdapter: ProviderAdapter = {
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

  async generateAudio(
    request: AudioGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<AudioGenerationResult> {
    requireApiKey(config);
    const model = getModelForCapability(config, "audio", request.model);
    requireModel(model, config);

    const voiceId = request.voiceId || config.extra?.voiceId || config.manifest.extraDefaults?.voiceId;
    if (!voiceId) {
      throw new Error("ElevenLabs voice ID is not configured.");
    }

    const outputFormat =
      request.format || config.extra?.outputFormat || config.manifest.extraDefaults?.outputFormat || "mp3_44100_128";
    const url = new URL(joinUrl(config.baseUrl, `/v1/text-to-speech/${voiceId}`));
    url.searchParams.set("output_format", outputFormat);

    const response = await fetch(url, {
      method: "POST",
      headers: headers(config),
      body: JSON.stringify({
        text: request.prompt,
        model_id: model,
      }),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const audioUrl = toDataUrl(await response.arrayBuffer(), contentType);

    return {
      audioUrl,
      rawData: "",
      error: "",
      providerId: config.providerId,
      model,
    };
  },
};
