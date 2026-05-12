import { NextResponse } from "next/server";
import { diagnosticsFromError } from "@/lib/daemon/diagnostics";
import { generateContentPackage } from "@/lib/providers/generation";
import { packageGenerateSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(packageGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await generateContentPackage(validation.data);
    return withRateLimitHeaders(NextResponse.json(result));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate package",
        details: error instanceof Error ? error.message : "Unknown error",
        diagnostics: diagnosticsFromError(error),
      },
      { status: 500 }
    );
  }
}
