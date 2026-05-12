import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";
import { buildPackageLiveArtifact } from "@/daemon/live-artifacts/package";
import { listProjectFiles, readProjectFile, writeProjectFile } from "@/daemon/projects/store";
import type { ExportRecord } from "@/lib/minimax/types";
import { DATA_DIR } from "@/lib/storage/db";
import { createExport } from "@/lib/storage/exports";

import { createZip, type ZipEntry } from "./zip";

export type ProfessionalPackageExport = {
  exportRecord: ExportRecord | null;
  projectId: string;
  files: {
    markdown: string;
    json: string;
    html: string;
    zip: string;
  };
};

type JsonRecord = Record<string, unknown>;

export async function createProfessionalPackageExport(input: {
  projectId: string;
  context?: DaemonContext;
  createRecord?: boolean;
}): Promise<ProfessionalPackageExport> {
  const context = input.context ?? createDaemonContext({ storageDir: DATA_DIR });
  const artifact = await buildPackageLiveArtifact(context, { projectId: input.projectId });
  if (!artifact) throw new Error("package artifact not found");

  const packageJson = await readJson(context, input.projectId, artifact.provenance.packagePath);
  const titles = await readJson(context, input.projectId, "files/titles.json");
  const captions = await readJson(context, input.projectId, "files/captions.json");
  const critique = await readJson(context, input.projectId, "files/critique.json");
  const thumbnail = await readJson(context, input.projectId, "files/thumbnail.json");
  const exportedAt = new Date().toISOString();
  const slug = slugify(artifact.selectedTitle || artifact.title || input.projectId);
  const exportDir = `files/exports/${input.projectId}-${Date.now()}`;

  const payload = {
    exportedAt,
    project: artifact.project,
    liveArtifact: artifact,
    package: packageJson,
    titles,
    captions,
    critique,
    thumbnail,
  };
  const markdown = renderMarkdown(payload);
  const html = renderHtml(payload);
  const json = JSON.stringify(payload, null, 2);
  const zip = await buildZip(context, input.projectId, {
    "package.md": Buffer.from(markdown, "utf8"),
    "package.json": Buffer.from(json, "utf8"),
    "package.html": Buffer.from(html, "utf8"),
    "README.md": Buffer.from(renderReadme(payload), "utf8"),
  });

  const files = {
    markdown: `${exportDir}/${slug}.md`,
    json: `${exportDir}/${slug}.json`,
    html: `${exportDir}/${slug}.html`,
    zip: `${exportDir}/${slug}.zip`,
  };

  await writeStorageFile(context, files.markdown, Buffer.from(markdown, "utf8"));
  await writeStorageFile(context, files.json, Buffer.from(json, "utf8"));
  await writeStorageFile(context, files.html, Buffer.from(html, "utf8"));
  await writeStorageFile(context, files.zip, zip);
  await writeProjectFile(context, input.projectId, "files/exports/package.md", Buffer.from(markdown, "utf8"));
  await writeProjectFile(context, input.projectId, "files/exports/package.json", Buffer.from(json, "utf8"));
  await writeProjectFile(context, input.projectId, "files/exports/package.html", Buffer.from(html, "utf8"));

  const exportRecord =
    input.createRecord === false
      ? null
      : await createExport({
          title: `Export - ${artifact.selectedTitle}`,
          type: "package",
          status: "completed",
          files: [files.markdown, files.json, files.html, files.zip],
          progress: 100,
          format: "zip",
          downloadPath: files.zip,
          metadata: {
            projectId: input.projectId,
            selectedTitle: artifact.selectedTitle,
            critiqueScore: artifact.critiqueScore,
            sourceFiles: artifact.provenance.sourceFiles,
          },
        });

  return {
    exportRecord,
    projectId: input.projectId,
    files,
  };
}

async function buildZip(context: DaemonContext, projectId: string, generated: Record<string, Buffer>) {
  const entries: ZipEntry[] = Object.entries(generated).map(([name, data]) => ({ name, data }));
  const files = await listProjectFiles(context, projectId);
  for (const file of files) {
    if (file.path.startsWith("files/exports/")) continue;
    try {
      const read = await readProjectFile(context, projectId, file.path);
      entries.push({ name: `project-files/${file.path}`, data: read.bytes });
    } catch {
      // Keep export best-effort when a generated attachment disappears.
    }
  }
  return createZip(entries);
}

async function writeStorageFile(context: DaemonContext, relativePath: string, data: Buffer) {
  const fullPath = join(context.storageDir, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
}

async function readJson(context: DaemonContext, projectId: string, path: string): Promise<JsonRecord | null> {
  try {
    const { bytes } = await readProjectFile(context, projectId, path);
    const parsed = JSON.parse(bytes.toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonRecord : null;
  } catch {
    return null;
  }
}

function renderMarkdown(payload: JsonRecord) {
  const artifact = payload.liveArtifact as JsonRecord;
  const pkg = (payload.package as JsonRecord | null) ?? {};
  const titles = (payload.titles as JsonRecord | null) ?? {};
  const captions = (payload.captions as JsonRecord | null) ?? {};
  const critique = (payload.critique as JsonRecord | null) ?? {};
  const titleCandidates = asArray(titles.candidates ?? pkg.titleCandidates);
  const topTitles = asArray(titles.top3 ?? pkg.topTitleCandidates);
  const captionList = asArray(captions.captions);

  return [
    `# ${stringValue(artifact.selectedTitle) || stringValue(pkg.selectedTitle) || "Open Studio Package"}`,
    "",
    `Exportado em: ${payload.exportedAt}`,
    "",
    "## Resumo",
    stringValue(pkg.description) || stringValue(artifact.description) || "Sem descrição.",
    "",
    "## Top títulos",
    ...(topTitles.length ? topTitles.map((item, index) => `${index + 1}. ${titleText(item)}`) : ["Sem top títulos registrados."]),
    "",
    "## Lista completa de títulos",
    ...(titleCandidates.length ? titleCandidates.map((item, index) => `${index + 1}. ${titleText(item)}`) : ["Sem lista completa registrada."]),
    "",
    "## Thumbnail",
    stringValue(pkg.thumbnailPrompt) || stringValue(artifact.thumbnailPrompt) || "Sem prompt de thumbnail.",
    stringValue(pkg.thumbnailText) ? `Texto: ${stringValue(pkg.thumbnailText)}` : "",
    "",
    "## Roteiro",
    stringValue(pkg.script) || stringValue(artifact.script) || "Sem roteiro registrado.",
    "",
    "## Legendas / Descrição SEO",
    ...(captionList.length ? captionList.map((item) => String(item)) : ["Sem legendas registradas."]),
    "",
    "## Crítica",
    critique.cohesionScore !== undefined ? `Score de coerência: ${critique.cohesionScore}/100` : "Sem crítica registrada.",
    ...asArray(critique.issues).map((issue) => `- ${stringValue((issue as JsonRecord).message)}`),
    "",
  ].filter((line) => line !== "").join("\n");
}

function renderReadme(payload: JsonRecord) {
  const artifact = payload.liveArtifact as JsonRecord;
  return [
    "# Open Studio Export",
    "",
    `Pacote: ${stringValue(artifact.selectedTitle) || "Open Studio Package"}`,
    `Projeto: ${stringValue((artifact.project as JsonRecord)?.id)}`,
    `Exportado em: ${payload.exportedAt}`,
    "",
    "Arquivos principais:",
    "- package.md: versão editável em Markdown",
    "- package.json: dados estruturados completos",
    "- package.html: página visual de entrega",
    "- project-files/: cópia dos arquivos usados no projeto",
  ].join("\n");
}

function renderHtml(payload: JsonRecord) {
  const artifact = payload.liveArtifact as JsonRecord;
  const pkg = (payload.package as JsonRecord | null) ?? {};
  const titles = (payload.titles as JsonRecord | null) ?? {};
  const captions = (payload.captions as JsonRecord | null) ?? {};
  const critique = (payload.critique as JsonRecord | null) ?? {};
  const topTitles = asArray(titles.top3 ?? pkg.topTitleCandidates);
  const captionList = asArray(captions.captions);
  const title = escapeHtml(stringValue(artifact.selectedTitle) || stringValue(pkg.selectedTitle) || "Open Studio Package");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;background:#0b0b0d;color:#f5f2f4;font:16px/1.6 Inter,Arial,sans-serif}
    main{max-width:980px;margin:0 auto;padding:48px 24px}
    section{border:1px solid rgba(255,255,255,.1);background:#151516;border-radius:14px;padding:24px;margin:18px 0}
    h1{font-size:38px;line-height:1.05;margin:0 0 16px} h2{font-size:18px;margin:0 0 14px;color:#d06fa7}
    pre{white-space:pre-wrap;font:14px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;color:#cfd4e6}
    li{margin:8px 0}.score{display:inline-block;border:1px solid rgba(208,111,167,.35);border-radius:999px;padding:6px 12px;color:#d06fa7}
  </style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p>Exportado em ${escapeHtml(String(payload.exportedAt))}</p>
  <section><h2>Resumo</h2><p>${escapeHtml(stringValue(pkg.description) || stringValue(artifact.description) || "Sem descrição.")}</p></section>
  <section><h2>Top títulos</h2><ol>${topTitles.map((item) => `<li>${escapeHtml(titleText(item))}</li>`).join("") || "<li>Sem top títulos registrados.</li>"}</ol></section>
  <section><h2>Thumbnail</h2><pre>${escapeHtml(stringValue(pkg.thumbnailPrompt) || stringValue(artifact.thumbnailPrompt) || "Sem prompt.")}</pre></section>
  <section><h2>Roteiro</h2><pre>${escapeHtml(stringValue(pkg.script) || stringValue(artifact.script) || "Sem roteiro registrado.")}</pre></section>
  <section><h2>Legendas / descrição SEO</h2><pre>${escapeHtml(captionList.map(String).join("\n\n") || "Sem legendas registradas.")}</pre></section>
  <section><h2>Crítica</h2><p class="score">${critique.cohesionScore ?? "Sem score"}</p></section>
</main>
</body>
</html>`;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function titleText(item: unknown) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && typeof (item as JsonRecord).title === "string") return (item as JsonRecord).title as string;
  return String(item ?? "");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "open-studio-package";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
