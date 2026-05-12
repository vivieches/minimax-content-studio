import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
} from "../types";
import { getModelForCapability, joinUrl, readError, requireModel, toDataUrl } from "../http";

function dimensionsForAspectRatio(aspectRatio?: string) {
  if (aspectRatio === "1:1") return { width: "1024", height: "1024" };
  if (aspectRatio === "9:16") return { width: "720", height: "1280" };
  return { width: "1280", height: "720" };
}

function imageEndpointUrl(config: ProviderRuntimeConfig, prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt);
  if (config.apiKey) return joinUrl(config.baseUrl, `/image/${encodedPrompt}`);
  if (config.baseUrl.includes("image.pollinations.ai")) return joinUrl(config.baseUrl, encodedPrompt);
  if (config.baseUrl.includes("gen.pollinations.ai")) return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
  return joinUrl(config.baseUrl, `/image/${encodedPrompt}`);
}

function authHeaders(config: ProviderRuntimeConfig) {
  const headers: Record<string, string> = { ...config.customHeaders };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  return headers;
}

async function fetchImageDataUrl(url: URL, config: ProviderRuntimeConfig): Promise<string> {
  const response = await fetch(url, {
    headers: authHeaders(config),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    throw new Error(await readError(response));
  }

  return toDataUrl(await response.arrayBuffer(), contentType);
}

export const pollinationsAdapter: ProviderAdapter = {
  async testConnection(config: ProviderRuntimeConfig): Promise<ProviderTestResult> {
    try {
      const response = await fetch(joinUrl(config.baseUrl, "/image/models"), {
        headers: authHeaders(config),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      return { ok: true, models: config.manifest.modelOptions?.image ?? ["flux"] };
    } catch (error) {
      return {
        ok: false,
        models: [],
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  async listModels(config: ProviderRuntimeConfig): Promise<string[]> {
    const response = await fetch(joinUrl(config.baseUrl, "/image/models"), {
      headers: config.apiKey ? authHeaders(config) : config.customHeaders,
    });

    if (!response.ok) return config.manifest.modelOptions?.image ?? ["flux"];

    const data = await response.json();
    if (!Array.isArray(data)) return config.manifest.modelOptions?.image ?? ["flux"];

    return data
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return String(record.id ?? record.model ?? record.name ?? "");
        }
        return "";
      })
      .filter(Boolean);
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    const model = getModelForCapability(config, "image", request.model);
    requireModel(model, config);

    const { width, height } = dimensionsForAspectRatio(request.aspectRatio);
    const count = request.n ?? 1;
    const urls = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const url = new URL(imageEndpointUrl(config, request.prompt));
        url.searchParams.set("model", model);
        url.searchParams.set("width", width);
        url.searchParams.set("height", height);
        url.searchParams.set("nologo", "true");
        url.searchParams.set("private", "true");
        url.searchParams.set("safe", "true");
        url.searchParams.set("seed", String(Date.now() + index));
        return fetchImageDataUrl(url, config);
      })
    );

    return {
      urls,
      base64s: [],
      finalPrompt: request.prompt,
      providerId: config.providerId,
      model,
      raw: { imageCount: urls.length },
    };
  },
};
