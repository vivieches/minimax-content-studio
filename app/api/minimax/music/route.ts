import { NextResponse } from "next/server";
import { generateAudioWithProvider } from "@/lib/providers/generation";
import { createAsset } from "@/lib/storage/assets";
import { musicGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(musicGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { prompt, isInstrumental, sampleRate, bitrate, format, saveToAssets = true } = validation.data;

    const result = await generateAudioWithProvider({
      prompt,
      isInstrumental,
      sampleRate,
      bitrate,
      format,
    });

    if (saveToAssets && result.audioUrl) {
      try {
        await createAsset({
          type: "music",
          title: `Music - ${prompt.slice(0, 60)}`,
          description: prompt,
          filePath: result.audioUrl,
          metadata: { audioUrl: result.audioUrl, prompt, isInstrumental, providerId: result.providerId, model: result.model },
          sourceModule: "music-generator",
        });
      } catch {
        // Non-blocking
      }
    }

    return withRateLimitHeaders(NextResponse.json(result));
  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate music", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
