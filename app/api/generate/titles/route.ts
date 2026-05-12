import { NextResponse } from "next/server";
import { diagnosticsFromError } from "@/lib/daemon/diagnostics";
import { generateTitlePack } from "@/lib/providers/generation";
import { titleGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { PAYLOAD_LIMITS, validatePayloadSize, withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(titleGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { provider, saveToAssets, ...params } = validation.data;
    const result = await generateTitlePack({ ...params, saveToAssets }, provider);

    return withRateLimitHeaders(
      NextResponse.json({
        ok: true,
        ...result,
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate titles",
        details: error instanceof Error ? error.message : "Unknown error",
        diagnostics: diagnosticsFromError(error),
      },
      { status: 500 }
    );
  }
}
