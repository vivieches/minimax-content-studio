import { NextResponse } from "next/server";
import { getExports, createExport } from "@/lib/storage/exports";
import { exportSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let exports_ = await getExports();

    if (status) {
      exports_ = exports_.filter((e) => e.status === status);
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, exports: exports_ }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load exports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(exportSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const record = await createExport(validation.data);
    return withRateLimitHeaders(NextResponse.json({ ok: true, export: record }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create export" },
      { status: 500 }
    );
  }
}