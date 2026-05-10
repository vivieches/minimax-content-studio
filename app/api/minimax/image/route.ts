import { NextResponse } from "next/server";
import { generateImageWithProvider } from "@/lib/providers/generation";
import { createAsset } from "@/lib/storage/assets";
import { imageGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(imageGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { prompt, aspectRatio, n, saveToAssets = true, referenceImage, referenceType } = validation.data;

    console.log("[API] Generating image with prompt length:", prompt.length);
    console.log("[API] Reference image:", referenceImage ? `${referenceImage.slice(0, 60)}...` : "none");
    console.log("[API] Reference type:", referenceType || "none");

    const result = await generateImageWithProvider({
      prompt,
      aspectRatio,
      n,
      referenceImage,
      referenceType,
    });

    if (saveToAssets && result.urls.length > 0) {
      try {
        await createAsset({
          type: "thumbnail",
          title: `Thumbnail - ${prompt.slice(0, 60)}`,
          description: prompt,
          thumbnailPath: result.urls[0],
          metadata: {
            prompt,
            aspectRatio,
            urls: result.urls,
            variations: n,
            hasReference: !!referenceImage,
            referenceType,
            providerId: result.providerId,
            model: result.model,
            generatedAt: new Date().toISOString(),
          },
          sourceModule: "thumbnail-generator",
        });
      } catch {
        // Non-blocking: asset creation failure shouldn't fail the generation
      }
    }

    return withRateLimitHeaders(NextResponse.json(result));
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
