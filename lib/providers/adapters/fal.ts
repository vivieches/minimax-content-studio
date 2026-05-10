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
    Authorization: `Key ${config.apiKey}`,
    "Content-Type": "application/json",
    ...config.customHeaders,
  };
}

async function pollFalResponse(responseUrl: string, statusUrl?: string): Promise<unknown> {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (statusUrl) {
      const statusResponse = await fetch(statusUrl);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        if (status?.status === "COMPLETED") break;
        if (status?.error) throw new Error(String(status.error));
      }
    }

    const response = await fetch(responseUrl);
    if (response.ok) return response.json();
    if (response.status !== 202 && response.status !== 404) {
      throw new Error(await readError(response));
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error("fal.ai request is still processing. Try checking the job result later.");
}

async function submitFalRequest(
  config: ProviderRuntimeConfig,
  model: string,
  payload: Record<string, unknown>
): Promise<{ data: unknown; requestId?: string }> {
  requireApiKey(config);
  requireModel(model, config);

  const response = await fetch(joinUrl(config.baseUrl, model), {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = await response.json();
  const responseUrl = typeof data?.response_url === "string" ? data.response_url : "";
  if (!responseUrl) return { data, requestId: data?.request_id };
  return {
    data: await pollFalResponse(responseUrl, data?.status_url),
    requestId: data?.request_id,
  };
}

export const falAdapter: ProviderAdapter = {
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
    const { data, requestId } = await submitFalRequest(config, model, {
      prompt: request.prompt,
      image_size: request.aspectRatio === "1:1" ? "square_hd" : "landscape_16_9",
      num_images: request.n ?? 1,
    });

    return {
      urls: extractUrls(data),
      base64s: [],
      finalPrompt: request.prompt,
      providerId: config.providerId,
      model,
      jobId: requestId,
      raw: data,
    };
  },

  async generateVideo(
    request: VideoGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<VideoGenerationResult> {
    const model = getModelForCapability(config, "video", request.model);
    const { data, requestId } = await submitFalRequest(config, model, {
      prompt: request.prompt,
      image_url: request.imageUrl,
      duration: request.duration,
    });
    const urls = extractUrls(data);

    return {
      jobId: requestId || `fal-video-${Date.now()}`,
      status: urls.length ? "completed" : "queued",
      outputUrl: urls[0],
      providerId: config.providerId,
      model,
      raw: data,
    };
  },
};
