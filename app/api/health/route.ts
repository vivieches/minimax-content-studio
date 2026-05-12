import { NextResponse } from "next/server";
import { getDaemonHealth } from "@/lib/daemon-client";
import { DATA_DIR } from "@/lib/storage/db";

export async function GET() {
  const daemon = await getDaemonHealth();

  return NextResponse.json({
    ok: true,
    service: "open-studio-web",
    mode: daemon.ok ? "web-plus-daemon" : "local-next-compat",
    storageDir: DATA_DIR,
    daemon,
    capabilities: ["text", "image", "package"],
    timestamp: new Date().toISOString(),
  });
}
