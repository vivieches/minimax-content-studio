import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { listProjectFiles } from "@/daemon/projects/store";
import { DATA_DIR } from "@/lib/storage/db";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const files = await listProjectFiles(context, projectId);
    return NextResponse.json({ ok: true, files });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to list project files" },
      { status: 500 }
    );
  }
}
