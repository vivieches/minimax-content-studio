import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { resolveRevealTarget, revealPath } from "@/daemon/desktop/bridge";
import { verifyLocalRequest } from "@/daemon/security/localAuth";
import { DATA_DIR } from "@/lib/storage/db";

export async function POST(request: Request) {
  const context = createDaemonContext({ storageDir: DATA_DIR });
  const rawBody = Buffer.from(await request.arrayBuffer());
  const auth = await verifyLocalRequest(request, context, rawBody);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = JSON.parse(rawBody.toString("utf8")) as { target?: unknown; projectId?: unknown; dryRun?: unknown };
    const resolved = resolveRevealTarget(context, {
      target: typeof body.target === "string" ? body.target : undefined,
      projectId: typeof body.projectId === "string" ? body.projectId : undefined,
    });
    const result = await revealPath(resolved.path, { dryRun: body.dryRun === true });
    return NextResponse.json({ ok: true, ...resolved, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to reveal local path" },
      { status: 400 },
    );
  }
}
