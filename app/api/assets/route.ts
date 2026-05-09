import { NextResponse } from "next/server";
import { getAssets, createAsset } from "@/lib/storage/assets";
import { assetSchema, validateOr400 } from "@/lib/validation/schemas";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = Number(searchParams.get("limit") ?? 0);

    let assets = await getAssets();

    if (type) {
      assets = assets.filter((a) => a.type === type);
    }

    if (search) {
      assets = assets.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.description.toLowerCase().includes(search)
      );
    }

    if (Number.isInteger(limit) && limit > 0) {
      assets = assets.slice(0, limit);
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, assets }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.upload);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(assetSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const asset = await createAsset(validation.data);
    return withRateLimitHeaders(NextResponse.json({ ok: true, asset }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create asset" },
      { status: 500 }
    );
  }
}
