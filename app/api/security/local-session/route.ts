import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { createLocalSessionCookie } from "@/daemon/security/localAuth";
import { DATA_DIR } from "@/lib/storage/db";

export async function GET() {
  const context = createDaemonContext({ storageDir: DATA_DIR });
  const session = await createLocalSessionCookie(context);
  const response = NextResponse.json({ ok: true, mode: "local-session" });
  response.cookies.set(session.name, session.value, session.options);
  return response;
}
