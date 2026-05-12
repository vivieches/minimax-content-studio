import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { extname, normalize, relative, resolve } from "path";
import { getExport } from "@/lib/storage/exports";
import { DATA_DIR } from "@/lib/storage/db";

function safeDataPath(filePath: string): string {
  const normalized = normalize(filePath);
  if (normalized.includes("..")) throw new Error("Invalid export file path.");
  const fullPath = resolve(DATA_DIR, normalized);
  const rel = relative(DATA_DIR, fullPath);
  if (rel.startsWith("..")) throw new Error("Export file path escapes storage.");
  return fullPath;
}

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const record = await getExport(id);

  if (!record) {
    return NextResponse.json({ ok: false, error: "Export not found" }, { status: 404 });
  }

  try {
    if (record.downloadPath) {
      const content = await readFile(safeDataPath(record.downloadPath));
      const ext = extname(record.downloadPath).toLowerCase();
      const type = ext === ".zip"
        ? "application/zip"
        : ext === ".html"
          ? "text/html; charset=utf-8"
          : ext === ".md"
            ? "text/markdown; charset=utf-8"
            : "application/json; charset=utf-8";
      return new Response(content, {
        headers: {
          "content-type": type,
          "content-disposition": `attachment; filename="${record.downloadPath.split(/[\\/]/).pop() || `open-studio-${record.id}`}"`,
        },
      });
    }

    const files = await Promise.all(
      record.files.map(async (file) => {
        const content = await readFile(safeDataPath(file), "utf-8").catch(() => "");
        return { path: file, content };
      })
    );

    const bundle = {
      export: record,
      files,
      preparedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="open-studio-${record.id}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to prepare export download", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
