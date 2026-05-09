import { NextResponse } from "next/server";
import { generateVideo } from "@/lib/minimax/video";
import { createAsset } from "@/lib/storage/assets";
import { videoGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(videoGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { prompt, imageUrl, duration, saveToAssets = true } = validation.data;
    const result = await generateVideo({ prompt, imageUrl, duration });

    if (saveToAssets && result.status === "completed") {
      try {
        await createAsset({
          type: "video",
          title: `Video - ${prompt.slice(0, 60)}`,
          description: prompt,
          metadata: { prompt, jobId: result.jobId },
          sourceModule: "video-generator",
        });
      } catch {
        // Non-blocking
      }
    }

    return withRateLimitHeaders(NextResponse.json(result));
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate video", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}