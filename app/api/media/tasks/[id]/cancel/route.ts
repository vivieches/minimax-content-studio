import { NextResponse } from "next/server";
import { cancelMediaTask } from "@/lib/daemon/mediaTasks";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const task = await cancelMediaTask(id, typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined);
  if (!task) {
    return NextResponse.json({ ok: false, error: "media task not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: task.status === "cancelled", task });
}
