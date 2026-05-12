import { generateId, readDb, writeDb } from "@/lib/storage/db";
import type { Diagnostic } from "./diagnostics";

export type MediaSurface = "image" | "video" | "audio";
export type MediaTaskStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export interface MediaTaskFile {
  name: string;
  kind: MediaSurface;
  mime: string;
  url: string;
  providerId?: string;
  model?: string;
  size?: number;
  projectPath?: string;
}

export interface MediaTaskRecord {
  id: string;
  status: MediaTaskStatus;
  surface: MediaSurface;
  model: string;
  providerId?: string;
  prompt?: string;
  progress: string[];
  file?: MediaTaskFile;
  error?: string;
  errorKind?: string;
  diagnostics?: Diagnostic[];
  createdAt: string;
  updatedAt: string;
  endedAt?: string;
}

const MEDIA_TASKS_FILE = "media-tasks.json";

async function readTasks(): Promise<MediaTaskRecord[]> {
  return readDb<MediaTaskRecord[]>(MEDIA_TASKS_FILE, []);
}

async function writeTasks(tasks: MediaTaskRecord[]) {
  await writeDb(MEDIA_TASKS_FILE, tasks.slice(0, 200));
}

export async function createMediaTask(input: {
  surface: MediaSurface;
  model: string;
  providerId?: string;
  prompt?: string;
}): Promise<MediaTaskRecord> {
  const tasks = await readTasks();
  const now = new Date().toISOString();
  const task: MediaTaskRecord = {
    id: generateId(),
    status: "queued",
    surface: input.surface,
    model: input.model,
    providerId: input.providerId,
    prompt: input.prompt,
    progress: [],
    createdAt: now,
    updatedAt: now,
  };
  tasks.unshift(task);
  await writeTasks(tasks);
  return task;
}

export async function updateMediaTask(
  id: string,
  partial: Partial<Omit<MediaTaskRecord, "id" | "createdAt">> & { progressMessage?: string }
): Promise<MediaTaskRecord | null> {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const { progressMessage, ...recordPatch } = partial;
  const progress = progressMessage
    ? [...tasks[index].progress, progressMessage]
    : recordPatch.progress ?? tasks[index].progress;
  const next: MediaTaskRecord = {
    ...tasks[index],
    ...recordPatch,
    progress,
    updatedAt: now,
    endedAt:
      recordPatch.status === "done" || recordPatch.status === "failed" || recordPatch.status === "cancelled"
        ? now
        : recordPatch.endedAt ?? tasks[index].endedAt,
  };
  tasks[index] = next;
  await writeTasks(tasks);
  return next;
}

export async function cancelMediaTask(id: string, reason = "cancelled by user"): Promise<MediaTaskRecord | null> {
  const task = await getMediaTask(id);
  if (!task) return null;
  if (task.status === "done" || task.status === "failed" || task.status === "cancelled") return task;
  return updateMediaTask(id, {
    status: "cancelled",
    error: reason,
    errorKind: "cancelled",
    progressMessage: reason,
  });
}

export async function getMediaTask(id: string): Promise<MediaTaskRecord | null> {
  const tasks = await readTasks();
  return tasks.find((task) => task.id === id) ?? null;
}

export async function listMediaTasks(limit = 50): Promise<MediaTaskRecord[]> {
  const tasks = await readTasks();
  return tasks.slice(0, Math.max(1, Math.min(limit, 200)));
}
