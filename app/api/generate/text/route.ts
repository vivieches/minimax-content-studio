import { NextResponse } from "next/server";
import { generateTextWithProvider } from "@/lib/providers/generation";
import { textProviderGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(textProviderGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { provider, ...params } = validation.data;
    const result = await generateTextWithProvider(params, provider);
    return withRateLimitHeaders(NextResponse.json({ ok: true, ...result }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate text", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
