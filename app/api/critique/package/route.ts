import { NextResponse } from "next/server";

import { critiqueContentPackage, writeCritiqueProjectFile } from "@/daemon/critique/package";
import { createAsset } from "@/lib/storage/assets";
import { critiquePackageSchema, validateOr400 } from "@/lib/validation/schemas";
import { PAYLOAD_LIMITS, validatePayloadSize, withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const sizeError = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const validation = validateOr400(critiquePackageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { saveToAssets, projectId, ...input } = validation.data;
    const critique = critiqueContentPackage({ ...input, projectId });

    if (saveToAssets !== false) {
      await writeCritiqueProjectFile({ projectId, critique });
      await createAsset({
        type: "prompt",
        title: `Crítica do pacote - ${input.selectedTitle || input.title || "Open Studio"}`,
        description: critique.recommendedTitleReason || "Score de coerência entre título, thumbnail e roteiro.",
        content: JSON.stringify(critique, null, 2),
        metadata: {
          projectId: projectId ?? "",
          cohesionScore: critique.cohesionScore,
          recommendedTitle: critique.recommendedTitle ?? "",
        },
        sourceModule: "package-critique",
        tags: ["critique", "package", "ctr"],
      });
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, critique }));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to critique package",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
