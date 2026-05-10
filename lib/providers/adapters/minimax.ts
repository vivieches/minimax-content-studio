import type {
  AudioGenerationRequest,
  AudioGenerationResult,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderAdapter,
  ProviderRuntimeConfig,
  ProviderTestResult,
  TextGenerationRequest,
  TextGenerationResult,
  VideoGenerationRequest,
  VideoGenerationResult,
} from "../types";
import type { MiniMaxConfig } from "@/lib/minimax/config";

function toMiniMaxConfig(config: ProviderRuntimeConfig): MiniMaxConfig {
  return {
    apiKey: config.apiKey,
    apiKeyType: "pay_as_you_go",
    baseUrl: config.baseUrl,
    textModel: config.models.text || config.manifest.defaultModels.text || "MiniMax-M2.7",
    textModelFast: config.models.text || config.manifest.defaultModels.text || "MiniMax-M2.7-highspeed",
    imageModel: config.models.image || config.manifest.defaultModels.image || "image-01",
    musicModel: config.models.audio || config.manifest.defaultModels.audio || "music-2.6",
    videoModel: config.models.video || config.manifest.defaultModels.video || "",
    providerMode: "official-text-v2",
  };
}

export const minimaxAdapter: ProviderAdapter = {
  async testConnection(config: ProviderRuntimeConfig): Promise<ProviderTestResult> {
    const { testConnection } = await import("@/lib/minimax/client");
    return testConnection(toMiniMaxConfig(config));
  },

  async listModels(config: ProviderRuntimeConfig): Promise<string[]> {
    const { listModels } = await import("@/lib/minimax/client");
    return listModels(toMiniMaxConfig(config));
  },

  async generateText(
    request: TextGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<TextGenerationResult> {
    const { generateText } = await import("@/lib/minimax/text");
    const model = request.model || config.models.text || config.manifest.defaultModels.text || "";
    const content = await generateText({
      systemPrompt: request.systemPrompt ?? "",
      userMessage: request.prompt,
      model,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      config: toMiniMaxConfig(config),
    });
    return {
      content,
      providerId: config.providerId,
      model,
    };
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    const { generateImage } = await import("@/lib/minimax/image");
    const model = request.model || config.models.image || config.manifest.defaultModels.image || "";
    const result = await generateImage({
      prompt: request.prompt,
      model,
      aspectRatio: request.aspectRatio,
      n: request.n,
      referenceImage: request.referenceImage,
      referenceType: request.referenceType,
      config: toMiniMaxConfig(config),
    });
    return {
      ...result,
      providerId: config.providerId,
      model,
    };
  },

  async generateAudio(
    request: AudioGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<AudioGenerationResult> {
    const { generateMusic } = await import("@/lib/minimax/music");
    const model = request.model || config.models.audio || config.manifest.defaultModels.audio || "";
    const result = await generateMusic({
      prompt: request.prompt,
      model,
      isInstrumental: request.isInstrumental,
      sampleRate: request.sampleRate,
      bitrate: request.bitrate,
      format: request.format,
      config: toMiniMaxConfig(config),
    });
    return {
      ...result,
      providerId: config.providerId,
      model,
    };
  },

  async generateVideo(
    request: VideoGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<VideoGenerationResult> {
    const { generateVideo } = await import("@/lib/minimax/video");
    const model = request.model || config.models.video || config.manifest.defaultModels.video || "";
    const result = await generateVideo({
      prompt: request.prompt,
      model,
      imageUrl: request.imageUrl,
      duration: request.duration,
      config: toMiniMaxConfig(config),
    });
    return {
      ...result,
      providerId: config.providerId,
      model,
    };
  },
};
