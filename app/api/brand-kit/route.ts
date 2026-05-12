import { NextResponse } from "next/server";
import { deleteBrandReference, getBrandKit, updateBrandKit, upsertBrandReference } from "@/daemon/brand-kit/store";
import { PAYLOAD_LIMITS, validatePayloadSize, withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function GET() {
  return withRateLimitHeaders(NextResponse.json({ ok: true, brandKit: await getBrandKit() }));
}

export async function PATCH(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.upload);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const brandKit = await updateBrandKit(body);
    return withRateLimitHeaders(NextResponse.json({ ok: true, brandKit }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update brand kit" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.upload);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const brandKit = await upsertBrandReference(body);
    return withRateLimitHeaders(NextResponse.json({ ok: true, brandKit }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to add reference" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  const brandKit = await deleteBrandReference(id);
  return withRateLimitHeaders(NextResponse.json({ ok: true, brandKit }));
}
