import type { IncomingMessage, ServerResponse } from "http";

import type { DaemonContext } from "../context";
import { formatSseEvent, readRunEvents, subscribeRunEvents } from "../runs/events";
import { cancelRun, createRun, getRunWithEvents, listRuns, transitionRun } from "../runs/store";
import type { RunStatus } from "../runs/types";

type JsonValue = Record<string, unknown> | unknown[];

function sendJson(response: ServerResponse, statusCode: number, body: JsonValue) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(request: IncomingMessage) {
  const body = await readBody(request);
  if (!body.length) return {};
  return JSON.parse(body.toString("utf8"));
}

function splitRunPath(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "runs") return null;
  return {
    runId: parts[2] ? decodeURIComponent(parts[2]) : undefined,
    rest: parts.slice(3),
  };
}

export async function handleRunRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  context: DaemonContext,
  url: URL,
) {
  if (url.pathname === "/api/runs") {
    if (request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const status = url.searchParams.get("status") as RunStatus | "active" | null;
      sendJson(response, 200, {
        runs: await listRuns(context, {
          projectId: projectId || undefined,
          status: status || undefined,
        }),
      });
      return true;
    }
    if (request.method === "POST") {
      const run = await createRun(context, await readJsonBody(request));
      sendJson(response, 200, { run });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const parsed = splitRunPath(url);
  if (!parsed?.runId) return false;

  if (parsed.rest.length === 0) {
    if (request.method === "GET") {
      const result = await getRunWithEvents(context, parsed.runId);
      if (!result) sendJson(response, 404, { ok: false, error: "run_not_found" });
      else sendJson(response, 200, result);
      return true;
    }
    if (request.method === "PATCH") {
      const body = (await readJsonBody(request)) as { status?: RunStatus; payload?: Record<string, unknown> };
      if (!body.status) {
        sendJson(response, 400, { ok: false, error: "status_required" });
        return true;
      }
      const run = await transitionRun(context, parsed.runId, body.status, body.payload ?? {});
      sendJson(response, 200, { run });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (parsed.rest.length === 1 && parsed.rest[0] === "cancel") {
    if (request.method === "POST") {
      const body = (await readJsonBody(request)) as { signal?: string };
      const run = await cancelRun(context, parsed.runId, body.signal ?? "SIGTERM");
      sendJson(response, 200, { run });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (parsed.rest.length === 1 && parsed.rest[0] === "events") {
    if (request.method !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return true;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    });
    for (const event of await readRunEvents(context, parsed.runId)) {
      response.write(formatSseEvent(event));
    }
    const unsubscribe = subscribeRunEvents(parsed.runId, (event) => {
      response.write(formatSseEvent(event));
    });
    response.on("close", unsubscribe);
    return true;
  }

  return false;
}
