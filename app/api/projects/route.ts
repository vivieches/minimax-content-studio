import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { createProject, listProjects } from "@/daemon/projects/store";
import { DATA_DIR } from "@/lib/storage/db";
import { withRateLimitHeaders } from "@/lib/security/rateLimit";

export async function GET() {
  try {
    const context = createDaemonContext({ storageDir: DATA_DIR });
    return withRateLimitHeaders(NextResponse.json({ ok: true, projects: await listProjects(context) }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to list projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const project = await createProject(context, {
      id: typeof body.id === "string" ? body.id : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined,
    });
    return withRateLimitHeaders(NextResponse.json({ ok: true, project }));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}
