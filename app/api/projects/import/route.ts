import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { importProjectArchive } from "@/daemon/import/project";
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
    const body = JSON.parse(rawBody.toString("utf8")) as {
      name?: unknown;
      sourceName?: unknown;
      archiveBase64?: unknown;
    };
    if (typeof body.archiveBase64 !== "string" || !body.archiveBase64.trim()) {
      return NextResponse.json({ ok: false, error: "archiveBase64 is required" }, { status: 400 });
    }

    const result = await importProjectArchive({
      context,
      archive: Buffer.from(body.archiveBase64, "base64"),
      name: typeof body.name === "string" ? body.name : undefined,
      sourceName: typeof body.sourceName === "string" ? body.sourceName : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to import project" },
      { status: 400 },
    );
  }
}
