import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

const DATA_DIR = resolve(process.cwd(), "data");

async function ensureDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readDb<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDir();
  const filePath = join(DATA_DIR, filename);
  try {
    if (existsSync(filePath)) {
      const data = await readFile(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch {
    // File doesn't exist or is corrupt, return default
  }
  await writeFile(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
  return defaultValue;
}

export async function writeDb<T>(filename: string, data: T): Promise<void> {
  await ensureDir();
  const filePath = join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
