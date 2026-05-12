import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { buildPackageLiveArtifact } from "@/daemon/live-artifacts/package";
import { DATA_DIR } from "@/lib/storage/db";
import { withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const artifact = await buildPackageLiveArtifact(context, { projectId });
    return withRateLimitHeaders(NextResponse.json({ ok: true, artifact }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to build package artifact" },
      { status: 500 }
    );
  }
}
