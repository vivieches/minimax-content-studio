import { lstat, mkdir, realpath, stat } from "fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "path";

import type { DaemonContext } from "../context";

const FORBIDDEN_SEGMENT = /^$|^\.\.?$/;
const RESERVED_SEGMENTS = new Set([".open-studio", ".od", ".live-artifacts"]);
const RESERVED_ROOT_FILES = new Set(["project.json"]);

export function isSafeProjectId(id: string) {
  if (typeof id !== "string") return false;
  if (!id || id.length > 128) return false;
  if (/^\.+$/.test(id)) return false;
  return /^[A-Za-z0-9._-]+$/.test(id);
}

export function assertSafeProjectId(id: string) {
  if (!isSafeProjectId(id)) throw new Error("invalid project id");
}

export function projectDir(context: DaemonContext, projectId: string) {
  assertSafeProjectId(projectId);
  return join(context.projectsDir, projectId);
}

export function validateProjectPath(raw: string) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("invalid project path");
  }
  if (raw.includes("\0")) throw new Error("invalid project path");

  const normalized = raw.replace(/\\/g, "/");
  if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith("/")) {
    throw new Error("invalid project path");
  }

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0 || parts.some((part) => FORBIDDEN_SEGMENT.test(part))) {
    throw new Error("invalid project path");
  }
  if (parts.some((part) => RESERVED_SEGMENTS.has(part))) {
    throw new Error("reserved project path");
  }
  if (parts.length === 1 && RESERVED_ROOT_FILES.has(parts[0])) {
    throw new Error("reserved project path");
  }

  return parts.join("/");
}

export async function ensureProjectDir(context: DaemonContext, projectId: string) {
  const dir = projectDir(context, projectId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function resolveProjectFilePath(context: DaemonContext, projectId: string, rawPath: string) {
  const safePath = validateProjectPath(rawPath);
  const dir = await ensureProjectDir(context, projectId);
  const rootReal = await realpath(dir).catch(() => dir);
  const candidate = resolve(dir, safePath);
  const realCandidate = await realpath(candidate).catch(async (error: NodeJS.ErrnoException) => {
    if (error?.code !== "ENOENT") throw error;
    return resolveExistingPrefix(candidate);
  });

  if (!isPathInside(rootReal, realCandidate)) {
    throw new Error("path escapes project dir");
  }

  return { safePath, filePath: candidate };
}

async function resolveExistingPrefix(pathname: string): Promise<string> {
  const parts = resolve(pathname).split(sep);
  for (let index = parts.length; index > 0; index--) {
    const prefix = parts.slice(0, index).join(sep) || sep;
    try {
      return await realpath(prefix);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") throw error;
    }
  }
  return resolve(pathname);
}

function isPathInside(root: string, target: string) {
  const rel = relative(root, target);
  return rel === "" || (!!rel && !rel.startsWith("..") && !rel.includes(`..${sep}`) && !isAbsolute(rel));
}

export async function assertNoSymlinkEscape(context: DaemonContext, projectId: string, safePath: string) {
  const dir = projectDir(context, projectId);
  const parts = safePath.split("/");
  let current = dir;
  for (const part of parts.slice(0, -1)) {
    current = join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error("path escapes project dir");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
      break;
    }
  }
}

export async function pathExists(pathname: string) {
  try {
    await stat(pathname);
    return true;
  } catch {
    return false;
  }
}

export function mimeFor(pathname: string) {
  const ext = extname(pathname).toLowerCase();
  if (ext === ".md") return "text/markdown; charset=utf-8";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  return "application/octet-stream";
}

export function kindFor(pathname: string) {
  const mime = mimeFor(pathname);
  if (mime.startsWith("text/")) return pathname.toLowerCase().endsWith(".md") ? "markdown" : "text";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("application/json")) return "json";
  return "binary";
}
