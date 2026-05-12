import { readFile } from "fs/promises";

import type { DaemonContext } from "../context";

export type DaemonHealth = {
  ok: true;
  service: "open-studio-daemon";
  mode: "local-daemon";
  startedAt: string;
  storageDir: string;
  capabilities: string[];
  timestamp: string;
};

export type DaemonStatus = DaemonHealth & {
  uptimeMs: number;
  rootDir: string;
  projectsDir: string;
  runsDir: string;
  logsDir: string;
};

export type DaemonLogs = {
  ok: true;
  service: "open-studio-daemon";
  logFile: string;
  lines: string[];
  timestamp: string;
};

const CAPABILITIES = ["health", "status", "logs", "text", "image", "package"];

export function daemonHealthPayload(context: DaemonContext): DaemonHealth {
  return {
    ok: true,
    service: "open-studio-daemon",
    mode: "local-daemon",
    startedAt: context.startedAt,
    storageDir: context.storageDir,
    capabilities: CAPABILITIES,
    timestamp: new Date().toISOString(),
  };
}

export function daemonStatusPayload(context: DaemonContext): DaemonStatus {
  return {
    ...daemonHealthPayload(context),
    uptimeMs: Math.max(0, Date.now() - Date.parse(context.startedAt)),
    rootDir: context.rootDir,
    projectsDir: context.projectsDir,
    runsDir: context.runsDir,
    logsDir: context.logsDir,
  };
}

export async function daemonLogsPayload(context: DaemonContext, tailLines = 200): Promise<DaemonLogs> {
  let lines: string[] = [];
  try {
    const text = await readFile(context.logFile, "utf8");
    lines = text.split(/\r?\n/).filter(Boolean).slice(-Math.max(1, tailLines));
  } catch {
    lines = [];
  }

  return {
    ok: true,
    service: "open-studio-daemon",
    logFile: context.logFile,
    lines,
    timestamp: new Date().toISOString(),
  };
}
