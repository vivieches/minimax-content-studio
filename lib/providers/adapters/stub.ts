import { stubMediaDiagnostic } from "@/lib/daemon/diagnostics";
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
} from "../types";
import { aspectRatioToOpenAISize } from "../http";

function placeholderSize(aspectRatio?: string) {
  const openAiSize = aspectRatioToOpenAISize(aspectRatio);
  return openAiSize.replace("x", "x");
}

export const stubAdapter: ProviderAdapter = {
  async testConnection(): Promise<ProviderTestResult> {
    return { ok: true, models: ["stub-image"] };
  },

  async listModels(): Promise<string[]> {
    return ["stub-image"];
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    const model = request.model || config.models.image || "stub-image";
    const text = encodeURIComponent((request.prompt || "Open Studio").slice(0, 80));
    return {
      urls: [`https://placehold.co/${placeholderSize(request.aspectRatio)}/151922/ff5aa7?text=${text}`],
      base64s: [],
      finalPrompt: request.prompt,
      providerId: config.providerId,
      model,
      raw: { stub: true },
      diagnostics: [stubMediaDiagnostic({ providerId: config.providerId, model })],
    };
  },
};
