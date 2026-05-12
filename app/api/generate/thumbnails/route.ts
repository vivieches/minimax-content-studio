import { NextResponse } from "next/server";
import { createAsset } from "@/lib/storage/assets";
import { cacheGeneratedImageUrls } from "@/lib/storage/generatedImages";
import { getSettings } from "@/lib/storage/settings";
import { generateImageWithProvider, imageResultCacheSources } from "@/lib/providers/generation";
import { normalizeLocale } from "@/lib/locales";
import { thumbnailBatchGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

function publicRemoteUrls(urls: string[]) {
  return urls.filter((url) => /^https?:\/\//i.test(url));
}

function buildTechnicalThumbnailPrompt(input: {
  topic: string;
  title?: string;
  impactText?: string;
  audience?: string;
  visualStyle?: string;
  mood?: string;
  background?: string;
  colorPreference?: string;
  includeFace?: boolean;
  includeLogo?: boolean;
  includeText?: boolean;
  safeTextMode?: boolean;
  variation: number;
  quantity: number;
}) {
  const visibleText = input.impactText?.trim();
  const textInstruction = input.safeTextMode
    ? "Do not render any text, letters, symbols, captions, logos, UI gibberish, or watermarks. Leave clean negative space for a later overlay."
    : input.includeText && visibleText
      ? `Render one short, bold, high-contrast text phrase with this exact meaning: "${visibleText}". Keep it large, readable on mobile, and avoid extra words.`
      : "Do not render text in the image.";

  return [
    "Create a real 16:9 YouTube thumbnail image, not a prompt sheet, not a mockup, not a UI screen.",
    "Use a technical image-generation prompt in English for maximum provider quality.",
    `Video topic: ${input.topic}.`,
    input.title ? `Video title: ${input.title}.` : "",
    input.audience ? `Target audience: ${input.audience}.` : "",
    input.visualStyle ? `Visual style: ${input.visualStyle}.` : "",
    input.mood ? `Emotional tone: ${input.mood}.` : "",
    input.background ? `Background: ${input.background}.` : "",
    input.colorPreference ? `Color direction: ${input.colorPreference}.` : "",
    input.includeFace
      ? "Include one expressive creator-style human face as the main focal point when contextually useful. Natural features, clear eyes, no distorted anatomy."
      : "Use a product, concept, object, or scene as the main focal point instead of a human face.",
    input.includeLogo ? "Only include a logo if the topic clearly names a real product or brand." : "Do not invent random logos.",
    textInstruction,
    "Composition rules: strong focal point, high contrast, uncluttered layout, depth, clear hierarchy, cinematic lighting, no tiny text, no watermark.",
    `Variation ${input.variation} of ${input.quantity}: make this composition distinct while preserving the same topic and thumbnail package intent.`,
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(thumbnailBatchGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { provider, saveToAssets = true, quantity, ...params } = validation.data;
    const settings = await getSettings();
    const locale = normalizeLocale(params.locale ?? settings.language);
    const thumbnails = [];
    const errors: string[] = [];

    for (let index = 0; index < quantity; index += 1) {
      const prompt = buildTechnicalThumbnailPrompt({
        ...params,
        variation: index + 1,
        quantity,
      });

      try {
        const result = await generateImageWithProvider(
          {
            prompt,
            aspectRatio: params.aspectRatio,
            n: 1,
            referenceImage: params.referenceImage,
            referenceType: params.referenceType,
            locale,
            visibleText: params.impactText,
          },
          provider
        );
        const cachedUrls = await cacheGeneratedImageUrls(imageResultCacheSources(result));
        const url = cachedUrls[0] ?? result.urls[0] ?? result.base64s[0];
        if (!url) throw new Error("Provider returned no image URL or image bytes.");

        const thumbnail = {
          id: `${Date.now().toString(36)}-${index + 1}`,
          url,
          remoteUrls: publicRemoteUrls(result.urls),
          variation: index + 1,
          providerId: result.providerId,
          model: result.model,
          finalPrompt: result.finalPrompt || prompt,
          visibleText: params.impactText ?? "",
          locale,
          diagnostics: result.diagnostics ?? [],
        };
        thumbnails.push(thumbnail);

        if (saveToAssets) {
          await createAsset({
            type: "thumbnail",
            title: `Thumbnail ${index + 1} - ${(params.title || params.topic).slice(0, 80)}`,
            description: prompt,
            thumbnailPath: url,
            metadata: thumbnail as unknown as Record<string, unknown>,
            sourceModule: "thumbnail-batch",
            tags: ["thumbnail", "batch", result.providerId, locale],
          });
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown image generation error");
      }
    }

    if (!thumbnails.length) {
      return NextResponse.json(
        { ok: false, error: "Failed to generate thumbnails", details: errors.join(" | ") || "No provider result." },
        { status: 500 }
      );
    }

    return withRateLimitHeaders(NextResponse.json({
      ok: true,
      thumbnails,
      urls: thumbnails.map((thumbnail) => thumbnail.url),
      finalPrompt: thumbnails[0]?.finalPrompt,
      locale,
      errors,
    }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate thumbnails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
