import { appendFile } from "fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";

import { createDaemonContext, type DaemonContext, type DaemonContextOptions } from "./context";
import { daemonHealthPayload, daemonLogsPayload, daemonStatusPayload } from "./routes/health";
import { handleCritiqueRoutes } from "./routes/critique";
import { handleProjectRoutes } from "./routes/projects";
import { handleRunRoutes } from "./routes/runs";

export type StartDaemonServerOptions = DaemonContextOptions & {
  host?: string;
  port?: number;
};

export type StartedDaemonServer = {
  context: DaemonContext;
  host: string;
  port: number;
  url: string;
  server: Server;
  close: () => Promise<void>;
};

type JsonValue = Record<string, unknown> | unknown[];

function sendJson(response: ServerResponse, statusCode: number, body: JsonValue) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function appendDaemonLog(context: DaemonContext, level: "info" | "warn" | "error", message: string, data = {}) {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    level,
    message,
    data,
  });
  await appendFile(context.logFile, `${line}\n`, "utf8").catch(() => undefined);
}

function numericQueryParam(url: URL, name: string, fallback: number) {
  const value = Number(url.searchParams.get(name));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(1000, Math.floor(value));
}

async function handleDaemonRequest(request: IncomingMessage, response: ServerResponse, context: DaemonContext) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  await appendDaemonLog(context, "info", "request", { method: request.method, path: url.pathname });

  if (request.method !== "GET") {
    const runHandled = await handleRunRoutes(request, response, context, url);
    if (runHandled) return;
    const critiqueHandled = await handleCritiqueRoutes(request, response, context, url);
    if (critiqueHandled) return;
    const handled = await handleProjectRoutes(request, response, context, url);
    if (handled) return;
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  if (url.pathname === "/api/health") {
    sendJson(response, 200, daemonHealthPayload(context));
    return;
  }

  if (url.pathname === "/api/status") {
    sendJson(response, 200, daemonStatusPayload(context));
    return;
  }

  if (url.pathname === "/api/logs") {
    sendJson(response, 200, await daemonLogsPayload(context, numericQueryParam(url, "tail", 200)));
    return;
  }

  const handled = await handleProjectRoutes(request, response, context, url);
  if (handled) return;

  const runHandled = await handleRunRoutes(request, response, context, url);
  if (runHandled) return;

  sendJson(response, 404, { ok: false, error: "not_found", path: url.pathname });
}

export async function startDaemonServer(options: StartDaemonServerOptions = {}): Promise<StartedDaemonServer> {
  const context = createDaemonContext(options);
  const host = options.host ?? "127.0.0.1";
  const requestedPort = options.port ?? 7456;
  const server = createServer((request, response) => {
    void handleDaemonRequest(request, response, context).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : "unknown daemon error";
      await appendDaemonLog(context, "error", message);
      sendJson(response, 500, { ok: false, error: "daemon_error", message });
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : requestedPort;
  const url = `http://${host}:${port}`;
  await appendDaemonLog(context, "info", "daemon_started", { url });

  return {
    context,
    host,
    port,
    server,
    url,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}
