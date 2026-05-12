import { NextResponse } from "next/server";
import { createMemory, deleteMemory, extractMemoryCandidates, listMemories, updateMemory } from "@/daemon/memory/store";
import { PAYLOAD_LIMITS, validatePayloadSize, withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 20);
  const memories = await listMemories({ query, limit: Number.isFinite(limit) ? limit : 20 });
  return withRateLimitHeaders(NextResponse.json({ ok: true, memories }));
}

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.upload);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    if (typeof body?.extractFrom === "string") {
      const candidates = extractMemoryCandidates(body.extractFrom);
      const memories = [];
      for (const candidate of candidates) {
        memories.push(await createMemory(candidate));
      }
      return withRateLimitHeaders(NextResponse.json({ ok: true, memories }));
    }
    const memory = await createMemory(body);
    return withRateLimitHeaders(NextResponse.json({ ok: true, memory }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create memory" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.upload);
  if (sizeError) return sizeError;

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  const memory = await updateMemory(id, body);
  if (!memory) return NextResponse.json({ ok: false, error: "memory not found" }, { status: 404 });
  return withRateLimitHeaders(NextResponse.json({ ok: true, memory }));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  const deleted = await deleteMemory(id);
  return withRateLimitHeaders(NextResponse.json({ ok: true, deleted }));
}
