import { readDb, writeDb, generateId } from "./db";
import type { ExportRecord } from "../minimax/types";

export async function getExports(): Promise<ExportRecord[]> {
  return readDb<ExportRecord[]>("exports.json", []);
}

export async function getExport(id: string): Promise<ExportRecord | null> {
  const exports_ = await getExports();
  return exports_.find((e) => e.id === id) ?? null;
}

export async function createExport(data: Omit<ExportRecord, "id" | "createdAt" | "updatedAt">): Promise<ExportRecord> {
  const exports_ = await getExports();
  const now = new Date().toISOString();
  const record: ExportRecord = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    files: data.files ?? [],
    progress: data.progress ?? 0,
  };
  exports_.unshift(record);
  await writeDb("exports.json", exports_);
  return record;
}

export async function updateExport(id: string, partial: Partial<ExportRecord>): Promise<ExportRecord | null> {
  const exports_ = await getExports();
  const index = exports_.findIndex((e) => e.id === id);
  if (index === -1) return null;

  exports_[index] = { ...exports_[index], ...partial, updatedAt: new Date().toISOString() };
  await writeDb("exports.json", exports_);
  return exports_[index];
}

export async function deleteExport(id: string): Promise<boolean> {
  const exports_ = await getExports();
  const filtered = exports_.filter((e) => e.id !== id);
  if (filtered.length === exports_.length) return false;
  await writeDb("exports.json", filtered);
  return true;
}
