import { NextResponse } from "next/server";
import { listSkills } from "@/daemon/skills/registry";
import { withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const skills = await listSkills({ limit: Number.isFinite(limit) ? limit : 100 });
  return withRateLimitHeaders(NextResponse.json({ ok: true, skills }));
}
