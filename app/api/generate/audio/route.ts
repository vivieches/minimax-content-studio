import { NextResponse } from "next/server";
import { createAsset } from "@/lib/storage/assets";
import { generateAudioWithProvider } from "@/lib/providers/generation";
import { audioProviderGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(audioProviderGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { provider, saveToAssets = true, voiceId, ...params } = validation.data;
    const result = await generateAudioWithProvider({ ...params, voiceId }, provider);

    if (saveToAssets && result.audioUrl) {
      await createAsset({
        type: "music",
        title: `Audio - ${params.prompt.slice(0, 60)}`,
        description: params.prompt,
        filePath: result.audioUrl,
        metadata: result as unknown as Record<string, unknown>,
        sourceModule: "audio-generator",
        tags: ["audio", result.providerId],
      });
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate audio", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
