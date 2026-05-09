import { NextResponse } from "next/server";
import { getExport } from "@/lib/storage/exports";
import { readFile, mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getExport(id);

  if (!record) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  try {
    const DATA_DIR = resolve(process.cwd(), "data");
    const filesDir = join(DATA_DIR, "files");
    const scriptsDir = join(filesDir, "scripts");

    // Build a metadata file
    const metadata = {
      title: record.title,
      type: record.type,
      createdAt: record.createdAt,
      format: record.format,
      files: record.files,
      pipelineStatus: record.metadata?.pipelineStatus,
    };

    // Return metadata as JSON for the client to display/download
    return NextResponse.json({
      ok: true,
      metadata,
      export: record,
      message: "Download endpoint ready. Files available at data/files/.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to prepare export download", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
