import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
  VideoGenerationRequest,
  VideoGenerationResult,
} from "../types";
import { extractUrls, getModelForCapability, joinUrl, readError, requireApiKey, requireModel } from "../http";

function headers(config: ProviderRuntimeConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    Prefer: "wait=60",
    ...config.customHeaders,
  };
}

function predictionPath(model: string): string {
  const cleanModel = model.replace(/^\/+|\/+$/g, "");
  const parts = cleanModel.split("/");
  if (parts.length >= 2) {
    return `/v1/models/${parts[0]}/${parts[1]}/predictions`;
  }
  return "/v1/predictions";
}

async function createPrediction(
  config: ProviderRuntimeConfig,
  model: string,
  input: Record<string, unknown>
): Promise<unknown> {
  requireApiKey(config);
  requireModel(model, config);

  const response = await fetch(joinUrl(config.baseUrl, predictionPath(model)), {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export const replicateAdapter: ProviderAdapter = {
  async testConnection(config: ProviderRuntimeConfig): Promise<ProviderTestResult> {
    try {
      requireApiKey(config);
      return { ok: true, models: Object.values(config.manifest.defaultModels).filter(Boolean) };
    } catch (error) {
      return {
        ok: false,
        models: [],
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    const model = getModelForCapability(config, "image", request.model);
    const data = await createPrediction(config, model, {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio ?? "16:9",
      num_outputs: request.n ?? 1,
    });

    return {
      urls: extractUrls(data),
      base64s: [],
      finalPrompt: request.prompt,
      providerId: config.providerId,
      model,
      jobId: typeof (data as Record<string, unknown>)?.id === "string" ? String((data as Record<string, unknown>).id) : undefined,
      raw: data,
    };
  },

  async generateVideo(
    request: VideoGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<VideoGenerationResult> {
    const model = getModelForCapability(config, "video", request.model);
    const data = await createPrediction(config, model, {
      prompt: request.prompt,
      image: request.imageUrl,
      duration: request.duration,
    });
    const urls = extractUrls(data);
    const record = data as Record<string, unknown>;

    return {
      jobId: typeof record.id === "string" ? record.id : `replicate-video-${Date.now()}`,
      status: typeof record.status === "string" ? record.status : urls.length ? "completed" : "queued",
      outputUrl: urls[0],
      providerId: config.providerId,
      model,
      raw: data,
    };
  },
};
