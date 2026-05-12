import { randomUUID } from "crypto";
import { appendFile, readFile } from "fs/promises";
import { join } from "path";

import type { DaemonContext } from "../context";
import type { RunEvent } from "./types";

type RunEventSubscriber = (event: RunEvent) => void;

const subscribers = new Map<string, Set<RunEventSubscriber>>();

export function runEventsFile(context: DaemonContext, runId: string) {
  return join(context.runsDir, runId, "events.jsonl");
}

export async function emitRunEvent(
  context: DaemonContext,
  runId: string,
  type: string,
  payload: unknown = {},
): Promise<RunEvent> {
  const event: RunEvent = {
    id: `evt_${randomUUID().replace(/-/g, "")}`,
    runId,
    type,
    createdAt: new Date().toISOString(),
    payload,
  };
  await appendFile(runEventsFile(context, runId), `${JSON.stringify(event)}\n`, "utf8");
  publishRunEvent(event);
  return event;
}

export async function readRunEvents(context: DaemonContext, runId: string) {
  try {
    const text = await readFile(runEventsFile(context, runId), "utf8");
    return text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RunEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw error;
  }
}

export function subscribeRunEvents(runId: string, subscriber: RunEventSubscriber) {
  let set = subscribers.get(runId);
  if (!set) {
    set = new Set();
    subscribers.set(runId, set);
  }
  set.add(subscriber);

  return () => {
    const current = subscribers.get(runId);
    current?.delete(subscriber);
    if (current?.size === 0) subscribers.delete(runId);
  };
}

export function publishRunEvent(event: RunEvent) {
  const set = subscribers.get(event.runId);
  if (!set) return;
  for (const subscriber of set) subscriber(event);
}

export function formatSseEvent(event: RunEvent) {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
