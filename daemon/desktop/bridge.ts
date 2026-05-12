import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { isAbsolute, join, relative, resolve } from "path";

import type { DaemonContext } from "@/daemon/context";
import { projectDir } from "@/daemon/projects/paths";

export type RevealTarget = "storage" | "projects" | "project" | "exports";

export function resolveRevealTarget(context: DaemonContext, input: { target?: string; projectId?: string }) {
  const target = normalizeTarget(input.target);
  const rawPath =
    target === "storage"
      ? context.storageDir
      : target === "projects"
        ? context.projectsDir
        : target === "exports"
          ? join(context.storageDir, "files", "exports")
          : projectDir(context, input.projectId || "");
  const path = resolve(rawPath);
  assertInsideStorage(context, path);
  return { target, path };
}

export async function revealPath(path: string, options: { dryRun?: boolean } = {}) {
  if (options.dryRun) return { opened: false, command: null as string | null };

  await mkdir(path, { recursive: true });
  const command =
    process.platform === "win32"
      ? { bin: "explorer.exe", args: [path] }
      : process.platform === "darwin"
        ? { bin: "open", args: [path] }
        : { bin: "xdg-open", args: [path] };

  const child = spawn(command.bin, command.args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return { opened: true, command: command.bin };
}

function normalizeTarget(target?: string): RevealTarget {
  if (target === "storage" || target === "projects" || target === "project" || target === "exports") return target;
  return "storage";
}

function assertInsideStorage(context: DaemonContext, path: string) {
  if (!isAbsolute(path)) throw new Error("invalid desktop path");
  const storage = resolve(context.storageDir);
  const rel = relative(storage, path);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("desktop path escapes storage");
}
