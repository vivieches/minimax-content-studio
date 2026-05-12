#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const runSubscribers = new Map();

function parseFlags(argv) {
  const [command = "help", ...rest] = argv;
  const flags = {};
  for (let index = 0; index < rest.length; index++) {
    const item = rest[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index++;
  }
  return { command, flags };
}

function printHelp() {
  console.log(`Usage:
  open-studio-daemon serve --port 7456
  open-studio-daemon health --url http://127.0.0.1:7456

Env:
  OPEN_STUDIO_DAEMON_PORT defaults to 7456
  OPEN_STUDIO_DAEMON_HOST defaults to 127.0.0.1
  OPEN_STUDIO_DATA_DIR defaults to .open-studio
`);
}

async function createContext(flags) {
  const rootDir = resolve(process.cwd());
  const storageDir = resolve(String(flags.storage || process.env.OPEN_STUDIO_DATA_DIR || join(rootDir, ".open-studio")));
  const daemonDir = join(storageDir, "daemon");
  const projectsDir = join(storageDir, "projects");
  const runsDir = join(storageDir, "runs");
  const logsDir = join(daemonDir, "logs");
  const logFile = join(logsDir, "daemon.log");

  await mkdir(storageDir, { recursive: true });
  await mkdir(daemonDir, { recursive: true });
  await mkdir(projectsDir, { recursive: true });
  await mkdir(runsDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });

  return {
    rootDir,
    storageDir,
    daemonDir,
    projectsDir,
    runsDir,
    logsDir,
    logFile,
    startedAt: new Date().toISOString(),
  };
}

async function appendLog(context, level, message, data = {}) {
  const line = JSON.stringify({ at: new Date().toISOString(), level, message, data });
  await appendFile(context.logFile, `${line}\n`, "utf8").catch(() => undefined);
}

function health(context) {
  return {
    ok: true,
    service: "open-studio-daemon",
    mode: "local-daemon",
    startedAt: context.startedAt,
    storageDir: context.storageDir,
    capabilities: ["health", "status", "logs", "text", "image", "package"],
    timestamp: new Date().toISOString(),
  };
}

async function logs(context, tailLines = 200) {
  let lines = [];
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

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readJsonRequestBody(request) {
  const body = await readRequestBody(request);
  if (!body.length) return {};
  return JSON.parse(body.toString("utf8"));
}

function isSafeId(id) {
  return typeof id === "string" && id.length > 0 && id.length <= 128 && !/^\.+$/.test(id) && /^[A-Za-z0-9._-]+$/.test(id);
}

function runDir(context, runId) {
  if (!isSafeId(runId)) throw new Error("invalid run id");
  return join(context.runsDir, runId);
}

function runManifestPath(context, runId) {
  return join(runDir(context, runId), "run.json");
}

function runEventsPath(context, runId) {
  return join(runDir(context, runId), "events.jsonl");
}

async function emitRunEvent(context, runId, type, payload = {}) {
  const event = {
    id: `evt_${randomUUID().replace(/-/g, "")}`,
    runId,
    type,
    createdAt: new Date().toISOString(),
    payload,
  };
  await appendFile(runEventsPath(context, runId), `${JSON.stringify(event)}\n`, "utf8");
  const subscribers = runSubscribers.get(runId);
  if (subscribers) {
    for (const subscriber of subscribers) subscriber(event);
  }
  return event;
}

async function readRunEvents(context, runId) {
  try {
    const text = await readFile(runEventsPath(context, runId), "utf8");
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function sseEvent(event) {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

async function createRun(context, body = {}) {
  const now = new Date().toISOString();
  const id = typeof body.id === "string" && body.id ? body.id : `run_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const dir = runDir(context, id);
  await mkdir(dir, { recursive: true });
  const run = {
    id,
    projectId: typeof body.projectId === "string" ? body.projectId : null,
    kind: typeof body.kind === "string" ? body.kind : "manual",
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    endedAt: null,
    cancelRequested: false,
    cancelSignal: null,
    error: null,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  };
  await writeFile(runManifestPath(context, id), JSON.stringify(run, null, 2), "utf8");
  await emitRunEvent(context, id, "run.created", { run });
  return run;
}

async function getRun(context, runId) {
  try {
    return JSON.parse(await readFile(runManifestPath(context, runId), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeRun(context, run) {
  await mkdir(runDir(context, run.id), { recursive: true });
  await writeFile(runManifestPath(context, run.id), JSON.stringify(run, null, 2), "utf8");
}

const terminalRunStatuses = new Set(["succeeded", "failed", "cancelled"]);
const legalTransitions = {
  queued: ["running", "cancelled"],
  running: ["awaiting_input", "succeeded", "failed", "cancelled"],
  awaiting_input: ["running", "failed", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: [],
};

async function transitionRun(context, runId, status, payload = {}) {
  const run = await getRun(context, runId);
  if (!run) throw new Error("run not found");
  if (!legalTransitions[run.status]?.includes(status)) {
    throw new Error(`invalid run transition: ${run.status} -> ${status}`);
  }
  const now = new Date().toISOString();
  const updated = {
    ...run,
    status,
    updatedAt: now,
    startedAt: status === "running" && !run.startedAt ? now : run.startedAt,
    endedAt: terminalRunStatuses.has(status) ? now : run.endedAt,
    error: status === "failed" && typeof payload.error === "string" ? payload.error : run.error,
  };
  await writeRun(context, updated);
  await emitRunEvent(context, runId, "run.status", { from: run.status, to: status, ...payload });
  return updated;
}

async function cancelRun(context, runId, signal = "SIGTERM") {
  const run = await getRun(context, runId);
  if (!run) throw new Error("run not found");
  if (terminalRunStatuses.has(run.status)) return run;
  const now = new Date().toISOString();
  const updated = {
    ...run,
    status: "cancelled",
    updatedAt: now,
    endedAt: now,
    cancelRequested: true,
    cancelSignal: signal,
  };
  await writeRun(context, updated);
  await emitRunEvent(context, runId, "run.cancelled", { signal });
  return updated;
}

async function listRuns(context, url) {
  const entries = await readdir(context.runsDir, { withFileTypes: true }).catch(() => []);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const runs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const run = await getRun(context, entry.name);
    if (!run) continue;
    if (projectId && run.projectId !== projectId) continue;
    if (status === "active" && terminalRunStatuses.has(run.status)) continue;
    if (status && status !== "active" && run.status !== status) continue;
    runs.push(run);
  }
  return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function handleRunRequest(context, request, response, url) {
  if (url.pathname === "/api/runs") {
    if (request.method === "GET") {
      sendJson(response, 200, { runs: await listRuns(context, url) });
      return true;
    }
    if (request.method === "POST") {
      sendJson(response, 200, { run: await createRun(context, await readJsonRequestBody(request)) });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "runs" || !parts[2]) return false;
  const runId = decodeURIComponent(parts[2]);
  const rest = parts.slice(3);

  if (rest.length === 0) {
    if (request.method === "GET") {
      const run = await getRun(context, runId);
      if (!run) sendJson(response, 404, { ok: false, error: "run_not_found" });
      else sendJson(response, 200, { run, events: await readRunEvents(context, runId) });
      return true;
    }
    if (request.method === "PATCH") {
      const body = await readJsonRequestBody(request);
      if (!body.status) {
        sendJson(response, 400, { ok: false, error: "status_required" });
        return true;
      }
      sendJson(response, 200, { run: await transitionRun(context, runId, body.status, body.payload || {}) });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (rest.length === 1 && rest[0] === "cancel") {
    if (request.method === "POST") {
      const body = await readJsonRequestBody(request);
      sendJson(response, 200, { run: await cancelRun(context, runId, body.signal || "SIGTERM") });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (rest.length === 1 && rest[0] === "events") {
    if (request.method !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return true;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    });
    for (const event of await readRunEvents(context, runId)) response.write(sseEvent(event));
    let subscribers = runSubscribers.get(runId);
    if (!subscribers) {
      subscribers = new Set();
      runSubscribers.set(runId, subscribers);
    }
    const subscriber = (event) => response.write(sseEvent(event));
    subscribers.add(subscriber);
    response.on("close", () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) runSubscribers.delete(runId);
    });
    return true;
  }

  return false;
}

async function serve(flags) {
  const context = await createContext(flags);
  const host = String(flags.host || process.env.OPEN_STUDIO_DAEMON_HOST || "127.0.0.1");
  const port = Number(flags.port || process.env.OPEN_STUDIO_DAEMON_PORT || 7456);

  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    await appendLog(context, "info", "request", { method: request.method, path: url.pathname });

    if (await handleRunRequest(context, request, response, url)) return;

    if (request.method !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }
    if (url.pathname === "/api/health") {
      sendJson(response, 200, health(context));
      return;
    }
    if (url.pathname === "/api/status") {
      sendJson(response, 200, {
        ...health(context),
        uptimeMs: Math.max(0, Date.now() - Date.parse(context.startedAt)),
        rootDir: context.rootDir,
        projectsDir: context.projectsDir,
        runsDir: context.runsDir,
        logsDir: context.logsDir,
      });
      return;
    }
    if (url.pathname === "/api/logs") {
      sendJson(response, 200, await logs(context, Number(url.searchParams.get("tail") || 200)));
      return;
    }
    sendJson(response, 404, { ok: false, error: "not_found", path: url.pathname });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number.isFinite(port) ? port : 7456, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const daemonUrl = `http://${host}:${actualPort}`;
  await appendLog(context, "info", "daemon_started", { url: daemonUrl });
  console.log(JSON.stringify({ ok: true, service: "open-studio-daemon", url: daemonUrl }));
}

async function healthCommand(flags) {
  const url = String(flags.url || process.env.OPEN_STUDIO_DAEMON_URL || "http://127.0.0.1:7456").replace(/\/$/, "");
  const response = await fetch(`${url}/api/health`);
  console.log(JSON.stringify(await response.json()));
  if (!response.ok) process.exit(1);
}

const { command, flags } = parseFlags(args);
if (command === "serve") await serve(flags);
else if (command === "health") await healthCommand(flags);
else printHelp();
