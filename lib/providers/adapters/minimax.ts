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

export const minimaxAdapter: ProviderAdapter = {
  async testConnection(): Promise<ProviderTestResult> {
    const { testConnection } = await import("@/lib/minimax/client");
    return testConnection();
  },

  async listModels(): Promise<string[]> {
    const { listModels } = await import("@/lib/minimax/client");
    return listModels();
  },

  async generateText(
    request: TextGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<TextGenerationResult> {
    const { generateText } = await import("@/lib/minimax/text");
    const content = await generateText({
      systemPrompt: request.systemPrompt ?? "",
      userMessage: request.prompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
    return {
      content,
      providerId: config.providerId,
      model: request.model || config.models.text || config.manifest.defaultModels.text || "",
    };
  },

  async generateImage(
    request: ImageGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<ImageGenerationResult> {
    const { generateImage } = await import("@/lib/minimax/image");
    const result = await generateImage({
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      n: request.n,
      referenceImage: request.referenceImage,
      referenceType: request.referenceType,
    });
    return {
      ...result,
      providerId: config.providerId,
      model: request.model || config.models.image || config.manifest.defaultModels.image || "",
    };
  },

  async generateAudio(
    request: AudioGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<AudioGenerationResult> {
    const { generateMusic } = await import("@/lib/minimax/music");
    const result = await generateMusic({
      prompt: request.prompt,
      isInstrumental: request.isInstrumental,
      sampleRate: request.sampleRate,
      bitrate: request.bitrate,
      format: request.format,
    });
    return {
      ...result,
      providerId: config.providerId,
      model: request.model || config.models.audio || config.manifest.defaultModels.audio || "",
    };
  },

  async generateVideo(
    request: VideoGenerationRequest,
    config: ProviderRuntimeConfig
  ): Promise<VideoGenerationResult> {
    const { generateVideo } = await import("@/lib/minimax/video");
    const result = await generateVideo({
      prompt: request.prompt,
      imageUrl: request.imageUrl,
      duration: request.duration,
    });
    return {
      ...result,
      providerId: config.providerId,
      model: request.model || config.models.video || config.manifest.defaultModels.video || "",
    };
  },
};
