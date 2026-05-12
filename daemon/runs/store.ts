import { randomUUID } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

import type { DaemonContext } from "../context";
import { isSafeProjectId } from "../projects/paths";
import { emitRunEvent, readRunEvents } from "./events";
import type { CreateRunInput, OpenStudioRun, RunListFilter, RunStatus } from "./types";

export const TERMINAL_RUN_STATUSES = new Set<RunStatus>(["succeeded", "failed", "cancelled"]);

const LEGAL_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["awaiting_input", "succeeded", "failed", "cancelled"],
  awaiting_input: ["running", "failed", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: [],
};

type AbortHandler = (signal: string) => void | Promise<void>;

const abortHandlers = new Map<string, AbortHandler>();

export function isLegalRunTransition(from: RunStatus, to: RunStatus) {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function runDir(context: DaemonContext, runId: string) {
  if (!isSafeProjectId(runId)) throw new Error("invalid run id");
  return join(context.runsDir, runId);
}

export function runManifestPath(context: DaemonContext, runId: string) {
  return join(runDir(context, runId), "run.json");
}

export async function createRun(context: DaemonContext, input: CreateRunInput = {}) {
  const now = new Date().toISOString();
  const id = input.id ?? `run_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const dir = runDir(context, id);
  await mkdir(dir, { recursive: true });

  const run: OpenStudioRun = {
    id,
    projectId: input.projectId ?? null,
    kind: input.kind ?? "manual",
    title: input.title?.trim() || null,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    endedAt: null,
    cancelRequested: false,
    cancelSignal: null,
    error: null,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
  };

  await writeRun(context, run);
  await emitRunEvent(context, run.id, "run.created", { run });
  return run;
}

export async function getRun(context: DaemonContext, runId: string) {
  try {
    const raw = await readFile(runManifestPath(context, runId), "utf8");
    return normalizeRun(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw error;
  }
}

export async function listRuns(context: DaemonContext, filter: RunListFilter = {}) {
  const entries = await readdir(context.runsDir, { withFileTypes: true }).catch(() => []);
  const runs: OpenStudioRun[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const run = await getRun(context, entry.name);
    if (!run) continue;
    if (filter.projectId && run.projectId !== filter.projectId) continue;
    if (filter.status === "active" && TERMINAL_RUN_STATUSES.has(run.status)) continue;
    if (filter.status && filter.status !== "active" && run.status !== filter.status) continue;
    runs.push(run);
  }

  return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function transitionRun(
  context: DaemonContext,
  runId: string,
  status: RunStatus,
  payload: Record<string, unknown> = {},
) {
  const run = await getRun(context, runId);
  if (!run) throw new Error("run not found");
  if (!isLegalRunTransition(run.status, status)) {
    throw new Error(`invalid run transition: ${run.status} -> ${status}`);
  }

  const now = new Date().toISOString();
  const updated: OpenStudioRun = {
    ...run,
    status,
    updatedAt: now,
    startedAt: status === "running" && !run.startedAt ? now : run.startedAt,
    endedAt: TERMINAL_RUN_STATUSES.has(status) ? now : run.endedAt,
    error: status === "failed" && typeof payload.error === "string" ? payload.error : run.error,
  };

  await writeRun(context, updated);
  await emitRunEvent(context, runId, "run.status", {
    from: run.status,
    to: status,
    ...payload,
  });
  return updated;
}

export async function cancelRun(context: DaemonContext, runId: string, signal = "SIGTERM") {
  const run = await getRun(context, runId);
  if (!run) throw new Error("run not found");
  if (TERMINAL_RUN_STATUSES.has(run.status)) return run;

  const abort = abortHandlers.get(runId);
  if (abort) await abort(signal);

  const now = new Date().toISOString();
  const updated: OpenStudioRun = {
    ...run,
    status: "cancelled",
    cancelRequested: true,
    cancelSignal: signal,
    updatedAt: now,
    endedAt: now,
  };
  await writeRun(context, updated);
  await emitRunEvent(context, runId, "run.cancelled", { signal });
  return updated;
}

export function registerRunAbortHandler(runId: string, handler: AbortHandler) {
  abortHandlers.set(runId, handler);
  return () => {
    abortHandlers.delete(runId);
  };
}

export async function getRunWithEvents(context: DaemonContext, runId: string) {
  const run = await getRun(context, runId);
  if (!run) return null;
  return { run, events: await readRunEvents(context, runId) };
}

async function writeRun(context: DaemonContext, run: OpenStudioRun) {
  await mkdir(runDir(context, run.id), { recursive: true });
  await writeFile(runManifestPath(context, run.id), JSON.stringify(run, null, 2), "utf8");
}

function normalizeRun(value: unknown): OpenStudioRun {
  if (!value || typeof value !== "object") throw new Error("invalid run manifest");
  const run = value as Partial<OpenStudioRun>;
  if (typeof run.id !== "string") throw new Error("invalid run manifest");
  const now = new Date().toISOString();
  return {
    id: run.id,
    projectId: typeof run.projectId === "string" ? run.projectId : null,
    kind: run.kind ?? "manual",
    title: typeof run.title === "string" ? run.title : null,
    status: run.status ?? "queued",
    createdAt: typeof run.createdAt === "string" ? run.createdAt : now,
    updatedAt: typeof run.updatedAt === "string" ? run.updatedAt : now,
    startedAt: typeof run.startedAt === "string" ? run.startedAt : null,
    endedAt: typeof run.endedAt === "string" ? run.endedAt : null,
    cancelRequested: run.cancelRequested === true,
    cancelSignal: typeof run.cancelSignal === "string" ? run.cancelSignal : null,
    error: typeof run.error === "string" ? run.error : null,
    metadata: run.metadata && typeof run.metadata === "object" ? run.metadata : {},
  };
}
