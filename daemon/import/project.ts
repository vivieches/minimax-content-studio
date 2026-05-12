import { basename } from "path";

import type { DaemonContext } from "@/daemon/context";
import { createProject, listProjectFiles, writeProjectFile } from "@/daemon/projects/store";
import type { OpenStudioProject, ProjectFileEntry } from "@/daemon/projects/types";

const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 1000;

export type ImportedProject = {
  project: OpenStudioProject;
  files: ProjectFileEntry[];
  importedEntries: string[];
};

type ZipEntry = {
  name: string;
  data: Buffer;
};

export async function importProjectArchive(input: {
  context: DaemonContext;
  archive: Buffer;
  name?: string;
  sourceName?: string;
}): Promise<ImportedProject> {
  if (input.archive.length > MAX_ARCHIVE_BYTES) throw new Error("archive too large");

  const entries = readStoredZip(input.archive);
  const project = await createProject(input.context, {
    name: input.name?.trim() || importNameFromSource(input.sourceName),
    metadata: {
      importedAt: new Date().toISOString(),
      sourceName: input.sourceName || "archive.zip",
      source: "project-import",
    },
  });

  const importedEntries: string[] = [];
  for (const entry of entries) {
    const path = mapArchivePath(entry.name);
    if (!path) continue;
    await writeProjectFile(input.context, project.id, path, entry.data);
    importedEntries.push(path);
  }

  if (importedEntries.length === 0) {
    throw new Error("archive has no importable project files");
  }

  return {
    project,
    files: await listProjectFiles(input.context, project.id),
    importedEntries,
  };
}

export function readStoredZip(archive: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 <= archive.length) {
    const signature = archive.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) throw new Error("invalid zip archive");

    const flags = archive.readUInt16LE(offset + 6);
    const method = archive.readUInt16LE(offset + 8);
    const compressedSize = archive.readUInt32LE(offset + 18);
    const fileNameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (flags & 0x0008) throw new Error("zip data descriptors are not supported");
    if (method !== 0) throw new Error("compressed zip entries are not supported");
    if (nameEnd > archive.length || dataEnd > archive.length) throw new Error("truncated zip archive");

    const name = archive.subarray(nameStart, nameEnd).toString("utf8");
    assertSafeArchiveName(name);
    if (!name.endsWith("/")) {
      entries.push({ name, data: archive.subarray(dataStart, dataEnd) });
    }
    if (entries.length > MAX_ENTRIES) throw new Error("archive has too many entries");

    offset = dataEnd;
  }

  return entries;
}

function mapArchivePath(name: string) {
  const normalized = normalizeArchiveName(name);
  if (normalized.startsWith("project-files/")) {
    return normalized.slice("project-files/".length);
  }
  if (normalized === "package.md" || normalized === "package.json" || normalized === "package.html" || normalized === "README.md") {
    return `files/imported/${normalized}`;
  }
  return `files/imported/${basename(normalized)}`;
}

function assertSafeArchiveName(name: string) {
  const normalized = normalizeArchiveName(name);
  if (!normalized) throw new Error("unsafe archive path");
  if (normalized.includes("\0")) throw new Error("unsafe archive path");
  if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith("/")) throw new Error("unsafe archive path");

  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error("unsafe archive path");
  if (parts.some((part) => part === ".open-studio" || part === ".od" || part === ".live-artifacts")) {
    throw new Error("unsafe archive path");
  }
}

function normalizeArchiveName(name: string) {
  return name.replace(/\\/g, "/").replace(/^\/+/, "");
}

function importNameFromSource(sourceName?: string) {
  const base = sourceName ? basename(sourceName).replace(/\.[^.]+$/, "") : "";
  return base ? `Imported ${base}` : "Imported Open Studio package";
}
