import { NextResponse } from "next/server";
import { listMediaTasks } from "@/lib/daemon/mediaTasks";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const tasks = await listMediaTasks(Number.isFinite(limit) ? limit : 50);
  return NextResponse.json({ ok: true, tasks, statuses: ["queued", "running", "done", "failed", "cancelled"] });
}
