import { NextResponse } from "next/server";
import { generateVideoWithProvider } from "@/lib/providers/generation";
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

    const { provider, saveToAssets, ...params } = validation.data;
    void saveToAssets;
    const result = await generateVideoWithProvider(params, provider);
    return withRateLimitHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate video", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
