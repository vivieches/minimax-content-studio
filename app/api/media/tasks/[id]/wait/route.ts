import { NextResponse } from "next/server";
import { getMediaTask } from "@/lib/daemon/mediaTasks";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { since?: number };
  const since = Number.isFinite(Number(body.since)) ? Math.max(0, Number(body.since)) : 0;
  const task = await getMediaTask(id);
  if (!task) {
    return NextResponse.json({ ok: false, error: "media task not found" }, { status: 404 });
  }

  const progress = task.progress.slice(since);
  if (task.status === "done") {
    return NextResponse.json({ ok: true, taskId: id, status: task.status, file: task.file, progress, nextSince: task.progress.length });
  }
  if (task.status === "failed") {
    return NextResponse.json(
      {
        ok: false,
        taskId: id,
        status: task.status,
        error: task.error,
        errorKind: task.errorKind,
        diagnostics: task.diagnostics ?? [],
        progress,
        nextSince: task.progress.length,
      },
      { status: 500 }
    );
  }
  if (task.status === "cancelled") {
    return NextResponse.json(
      { ok: false, taskId: id, status: task.status, error: task.error, errorKind: task.errorKind, progress, nextSince: task.progress.length },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, taskId: id, status: task.status, progress, nextSince: task.progress.length });
}
