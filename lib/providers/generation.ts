import { createAsset } from "@/lib/storage/assets";
import { createExport } from "@/lib/storage/exports";
import { saveContentFile } from "@/lib/minimax/files";
import { buildThumbnailPrompt } from "@/lib/prompts/thumbnailPrompt";
import { getAdapterForProvider } from "./registry";
import { isDemoModeEnabled, resolveProviderConfig, type ProviderOverride } from "./runtime";
import type {
  AudioGenerationRequest,
  AudioGenerationResult,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderCapability,
  TextGenerationRequest,
  TextGenerationResult,
  VideoGenerationRequest,
  VideoGenerationResult,
} from "./types";

const packageSystemPrompt = `You are Open Studio's content package planner.
Convert a creator briefing into a publish-ready content package.
Return only valid JSON with this shape:
{
  "title": "project title",
  "script": "ready-to-record script",
  "description": "platform-ready description",
  "tags": ["tag"],
  "thumbnailPrompt": "visual prompt for image generation",
  "thumbnailText": "short readable thumbnail text",
  "audioPrompt": "music or voiceover prompt",
  "videoPrompt": "short video generation prompt",
  "assumptions": ["short assumption"]
}`;

function parseJsonObject(content: string): Record<string, unknown> {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  const json = start >= 0 && end >= start ? content.slice(start, end + 1) : content;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {
      title: "Generated Package",
      script: content,
      description: "",
      tags: [],
      thumbnailPrompt: content.slice(0, 500),
      thumbnailText: "New Video",
      audioPrompt: "Short modern instrumental intro music",
      videoPrompt: content.slice(0, 500),
      assumptions: ["The provider returned plain text instead of JSON."],
    };
  }
}

export async function generateTextWithProvider(
  request: TextGenerationRequest,
  override?: ProviderOverride
): Promise<TextGenerationResult> {
  if (await isDemoModeEnabled()) {
    return {
      content: `[DEMO MODE]\n\n${request.prompt}`,
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-text",
    };
  }

  const config = await resolveProviderConfig("text", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateText) throw new Error(`${config.manifest.name} does not support text generation.`);
  return adapter.generateText(request, config);
}

export async function generateImageWithProvider(
  request: ImageGenerationRequest,
  override?: ProviderOverride
): Promise<ImageGenerationResult> {
  if (await isDemoModeEnabled()) {
    const text = encodeURIComponent(request.prompt.slice(0, 40) || "Open Studio");
    return {
      urls: [`https://placehold.co/1280x720/151922/ff5aa7?text=${text}`],
      base64s: [],
      finalPrompt: request.prompt,
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-image",
    };
  }

  const config = await resolveProviderConfig("image", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateImage) throw new Error(`${config.manifest.name} does not support image generation.`);
  return adapter.generateImage(request, config);
}

export async function generateAudioWithProvider(
  request: AudioGenerationRequest,
  override?: ProviderOverride
): Promise<AudioGenerationResult> {
  if (await isDemoModeEnabled()) {
    return {
      audioUrl: "",
      rawData: "",
      error: "",
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-audio",
      jobId: "demo-audio",
    };
  }

  const config = await resolveProviderConfig("audio", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateAudio) throw new Error(`${config.manifest.name} does not support audio generation.`);
  return adapter.generateAudio(request, config);
}

export async function generateVideoWithProvider(
  request: VideoGenerationRequest,
  override?: ProviderOverride
): Promise<VideoGenerationResult> {
  if (await isDemoModeEnabled()) {
    return {
      jobId: `demo-video-${Date.now()}`,
      status: "completed",
      outputUrl: "https://placehold.co/1920x1080/151922/ff5aa7?text=Open+Studio+Video",
      providerId: override?.providerId || "demo",
      model: override?.model || "demo-video",
    };
  }

  const config = await resolveProviderConfig("video", override);
  const adapter = getAdapterForProvider(config.providerId);
  if (!adapter.generateVideo) throw new Error(`${config.manifest.name} does not support video generation.`);
  return adapter.generateVideo(request, config);
}

export async function generateContentPackage(params: {
  briefing: string;
  steps?: ProviderCapability[];
  providers?: Partial<Record<ProviderCapability, ProviderOverride>>;
  saveToAssets?: boolean;
}): Promise<Record<string, unknown>> {
  const { briefing, steps = ["text", "image"], providers = {}, saveToAssets = true } = params;
  const textResult = await generateTextWithProvider(
    {
      systemPrompt: packageSystemPrompt,
      prompt: briefing,
      maxTokens: 4096,
      temperature: 0.7,
    },
    providers.text
  );

  const packageData = parseJsonObject(textResult.content);
  const title = String(packageData.title || `Open Studio - ${briefing.slice(0, 50)}`);
  const script = String(packageData.script || textResult.content);
  const exportFiles: string[] = [];
  const outputs: Record<string, unknown> = {
    text: {
      ...packageData,
      providerId: textResult.providerId,
      model: textResult.model,
    },
  };

  if (saveToAssets && script) {
    const filename = `${Date.now()}-open-studio-package-script.md`;
    await saveContentFile("scripts", filename, script);
    const filePath = `files/scripts/${filename}`;
    exportFiles.push(filePath);
    await createAsset({
      type: "script",
      title,
      description: briefing.slice(0, 200),
      content: script,
      filePath,
      metadata: packageData,
      sourceModule: "package-generator",
      tags: Array.isArray(packageData.tags) ? packageData.tags.map(String) : ["package"],
    });
  }

  if (steps.includes("image")) {
    const thumbnailPrompt = String(
      packageData.thumbnailPrompt ||
      buildThumbnailPrompt({
        theme: briefing,
        title,
        style: "Modern creator studio",
        text: String(packageData.thumbnailText || "New Video"),
      })
    );
    const imageResult = await generateImageWithProvider(
      { prompt: thumbnailPrompt, aspectRatio: "16:9", n: 1 },
      providers.image
    );
    outputs.image = imageResult;

    if (saveToAssets && imageResult.urls[0]) {
      await createAsset({
        type: "thumbnail",
        title: `Thumbnail - ${title}`,
        description: thumbnailPrompt,
        thumbnailPath: imageResult.urls[0],
        metadata: imageResult as unknown as Record<string, unknown>,
        sourceModule: "package-generator",
        tags: ["package", "thumbnail"],
      });
    }
  }

  if (steps.includes("audio")) {
    const audioResult = await generateAudioWithProvider(
      { prompt: String(packageData.audioPrompt || "Short modern instrumental intro music") },
      providers.audio
    );
    outputs.audio = audioResult;

    if (saveToAssets && audioResult.audioUrl) {
      await createAsset({
        type: "music",
        title: `Audio - ${title}`,
        description: String(packageData.audioPrompt || ""),
        filePath: audioResult.audioUrl,
        metadata: audioResult as unknown as Record<string, unknown>,
        sourceModule: "package-generator",
        tags: ["package", "audio"],
      });
    }
  }

  if (steps.includes("video")) {
    outputs.video = await generateVideoWithProvider(
      { prompt: String(packageData.videoPrompt || briefing), duration: 5 },
      providers.video
    );
  }

  const exportRecord = saveToAssets
    ? await createExport({
        title,
        type: "package",
        status: "completed",
        files: exportFiles,
        progress: 100,
        format: "package",
        metadata: { briefing, outputs },
      })
    : null;

  return {
    ok: true,
    title,
    briefing,
    outputs,
    exportId: exportRecord?.id,
  };
}
