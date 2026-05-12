import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { deleteProject, getProject, updateProject } from "@/daemon/projects/store";
import { DATA_DIR } from "@/lib/storage/db";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const context = createDaemonContext({ storageDir: DATA_DIR });
  const project = await getProject(context, projectId);
  if (!project) return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, project });
}

export async function PATCH(request: Request, { params }: Context) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const context = createDaemonContext({ storageDir: DATA_DIR });
  const project = await updateProject(context, projectId, {
    name: typeof body.name === "string" ? body.name : undefined,
    status: body.status,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined,
  });
  if (!project) return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, project });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId } = await params;
  const context = createDaemonContext({ storageDir: DATA_DIR });
  await deleteProject(context, projectId);
  return NextResponse.json({ ok: true });
}
