import { generateId, readDb, writeDb } from "@/lib/storage/db";

export type MemoryRecord = {
  id: string;
  content: string;
  tags: string[];
  source: "manual" | "extracted" | "brand-kit" | "script";
  weight: number;
  createdAt: string;
  updatedAt: string;
};

const MEMORY_FILE = "memory.json";

function now() {
  return new Date().toISOString();
}

function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags)
    ? tags.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : [];
}

function normalizeMemory(value: Partial<MemoryRecord>): MemoryRecord {
  const timestamp = now();
  return {
    id: value.id || generateId(),
    content: String(value.content ?? "").trim(),
    tags: normalizeTags(value.tags),
    source: value.source ?? "manual",
    weight: typeof value.weight === "number" && Number.isFinite(value.weight) ? Math.max(0, Math.min(10, value.weight)) : 5,
    createdAt: value.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

async function readMemory(): Promise<MemoryRecord[]> {
  const stored = await readDb<MemoryRecord[]>(MEMORY_FILE, []);
  return stored.map(normalizeMemory).filter((memory) => memory.content);
}

export async function listMemories(input: { query?: string; limit?: number } = {}): Promise<MemoryRecord[]> {
  const memories = await readMemory();
  const queryTokens = new Set(
    String(input.query ?? "")
      .toLowerCase()
      .match(/[\p{L}\p{N}]{3,}/gu) ?? []
  );
  const ranked = memories
    .map((memory) => {
      const content = memory.content.toLowerCase();
      const tagScore = memory.tags.reduce((score, tag) => score + (queryTokens.has(tag) ? 3 : content.includes(tag) ? 1 : 0), 0);
      const textScore = [...queryTokens].reduce((score, token) => score + (content.includes(token) ? 1 : 0), 0);
      return { memory, score: memory.weight + tagScore + textScore };
    })
    .sort((a, b) => b.score - a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt))
    .map((item) => item.memory);
  return ranked.slice(0, Math.max(1, Math.min(input.limit ?? 20, 100)));
}

export async function createMemory(input: Partial<MemoryRecord>): Promise<MemoryRecord> {
  const record = normalizeMemory(input);
  if (!record.content) throw new Error("memory content is required");
  const memories = await readMemory();
  memories.unshift(record);
  await writeDb(MEMORY_FILE, memories.slice(0, 500));
  return record;
}

export async function updateMemory(id: string, partial: Partial<MemoryRecord>): Promise<MemoryRecord | null> {
  const memories = await readMemory();
  const index = memories.findIndex((memory) => memory.id === id);
  if (index === -1) return null;
  memories[index] = normalizeMemory({ ...memories[index], ...partial, id, createdAt: memories[index].createdAt });
  await writeDb(MEMORY_FILE, memories);
  return memories[index];
}

export async function deleteMemory(id: string): Promise<boolean> {
  const memories = await readMemory();
  const next = memories.filter((memory) => memory.id !== id);
  if (next.length === memories.length) return false;
  await writeDb(MEMORY_FILE, next);
  return true;
}

export function extractMemoryCandidates(text: string): Array<Pick<MemoryRecord, "content" | "tags" | "source" | "weight">> {
  const lines = text
    .split(/\r?\n|[.?!]\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const patterns = [
    /\b(sempre|usar|prefiro|preferimos|tom|voz|audiencia|p[úu]blico|evitar|nunca)\b/i,
    /\b(always|prefer|tone|voice|audience|avoid|never)\b/i,
    /\b(siempre|prefiero|tono|voz|audiencia|evitar|nunca)\b/i,
  ];
  return lines
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, 8)
    .map((line) => ({
      content: line.slice(0, 500),
      tags: ["preference"],
      source: "extracted" as const,
      weight: 6,
    }));
}
