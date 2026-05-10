import { NextResponse } from "next/server";
import { createAsset } from "@/lib/storage/assets";
import { generateImageWithProvider } from "@/lib/providers/generation";
import { imageProviderGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(imageProviderGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { provider, saveToAssets = true, ...params } = validation.data;
    const result = await generateImageWithProvider(params, provider);

    if (saveToAssets && result.urls[0]) {
      await createAsset({
        type: "thumbnail",
        title: `Image - ${params.prompt.slice(0, 60)}`,
        description: params.prompt,
        thumbnailPath: result.urls[0],
        metadata: result as unknown as Record<string, unknown>,
        sourceModule: "image-generator",
        tags: ["image", result.providerId],
      });
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
