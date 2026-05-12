import { NextResponse } from "next/server";
import { diagnosticsFromError } from "@/lib/daemon/diagnostics";
import { researchSearchSchema, validateOr400 } from "@/lib/validation/schemas";
import { PAYLOAD_LIMITS, validatePayloadSize, withRateLimitHeaders } from "@/lib/security/rateLimit";
import { searchResearch } from "@/daemon/research/tavily";
import { writeResearchReport } from "@/daemon/research/report";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(researchSearchSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const findings = await searchResearch({
      query: validation.data.query,
      maxSources: validation.data.maxSources,
    });
    const result = await writeResearchReport({
      projectId: validation.data.projectId,
      findings,
    });

    return withRateLimitHeaders(NextResponse.json({ ok: true, research: result }));
  } catch (error) {
    const diagnostics = diagnosticsFromError(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Research failed",
        diagnostics,
      },
      { status: diagnostics[0]?.kind === "research_unconfigured" ? 400 : 500 }
    );
  }
}
