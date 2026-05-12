import { NextResponse } from "next/server";

import { createDaemonContext } from "@/daemon/context";
import { deleteProjectFile, readProjectFile, writeProjectFile } from "@/daemon/projects/store";
import { verifyLocalRequest } from "@/daemon/security/localAuth";
import { DATA_DIR } from "@/lib/storage/db";

type Context = { params: Promise<{ projectId: string; path: string[] }> };

function pathname(parts: string[]) {
  return parts.map((part) => decodeURIComponent(part)).join("/");
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { projectId, path } = await params;
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const { file, bytes } = await readProjectFile(context, projectId, pathname(path));
    return new Response(bytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": file.mime,
        "X-Open-Studio-Project-File": file.path,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read project file" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { projectId, path } = await params;
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const bytes = Buffer.from(await request.arrayBuffer());
    const auth = await verifyLocalRequest(request, context, bytes);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const file = await writeProjectFile(context, projectId, pathname(path), bytes);
    return NextResponse.json({ ok: true, file });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to write project file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { projectId, path } = await params;
    const context = createDaemonContext({ storageDir: DATA_DIR });
    const auth = await verifyLocalRequest(request, context);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    await deleteProjectFile(context, projectId, pathname(path));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete project file" },
      { status: 500 }
    );
  }
}
