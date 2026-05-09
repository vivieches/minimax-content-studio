import { writeFile, mkdir } from "fs/promises";
import { join, resolve, normalize, relative } from "path";

const DATA_DIR = resolve(process.cwd(), "data");
const FILES_DIR = join(DATA_DIR, "files");

const subdirs = ["scripts", "thumbnails", "music", "video", "exports"];

/**
 * Validates that a path stays within the allowed directory.
 * Prevents path traversal attacks (e.g., paths containing ".." or starting with "/").
 */
function sanitizePath(baseDir: string, userPath: string): string {
  // Reject absolute paths
  if (resolve(userPath) === userPath && !userPath.startsWith(baseDir)) {
    throw new Error(`Invalid path: absolute paths are not allowed`);
  }

  // Reject paths containing ".." segments
  const normalizedUser = normalize(userPath);
  if (normalizedUser.includes("..")) {
    throw new Error(`Invalid path: path traversal detected`);
  }

  // Resolve and verify the final path is within baseDir
  const fullPath = resolve(baseDir, userPath);
  const rel = relative(baseDir, fullPath);

  if (rel.startsWith("..") || resolve(fullPath) !== resolve(join(baseDir, rel))) {
    throw new Error(`Invalid path: path escapes allowed directory`);
  }

  return fullPath;
}

async function ensureDataDirs(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(FILES_DIR, { recursive: true });
  for (const sub of subdirs) {
    await mkdir(join(FILES_DIR, sub), { recursive: true });
  }
}

export async function downloadFile(url: string, destPath: string): Promise<string> {
  await ensureDataDirs();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fullPath = sanitizePath(DATA_DIR, destPath);

  const dir = fullPath.substring(0, fullPath.lastIndexOf("\\"));
  await mkdir(dir, { recursive: true });

  await writeFile(fullPath, buffer);
  return fullPath;
}

export async function saveJsonFile(filename: string, data: unknown): Promise<string> {
  await ensureDataDirs();
  const fullPath = sanitizePath(DATA_DIR, filename);
  await writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
  return fullPath;
}

export async function saveContentFile(
  type: string,
  filename: string,
  content: string
): Promise<string> {
  await ensureDataDirs();
  // Validate type is one of the allowed subdirectories
  if (!subdirs.includes(type)) {
    throw new Error(`Invalid content type: ${type}`);
  }
  const dir = join(FILES_DIR, type);
  await mkdir(dir, { recursive: true });
  const fullPath = sanitizePath(dir, filename);
  await writeFile(fullPath, content, "utf-8");
  return fullPath;
}

export { ensureDataDirs, DATA_DIR, FILES_DIR };