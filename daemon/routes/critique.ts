import type { IncomingMessage, ServerResponse } from "http";

import {
  critiqueContentPackage,
  writeCritiqueProjectFile,
  type CritiquePackageInput,
} from "@/daemon/critique/package";

type JsonValue = Record<string, unknown> | unknown[];

function sendJson(response: ServerResponse, statusCode: number, body: JsonValue) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleCritiqueRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  _context: unknown,
  url: URL
) {
  if (url.pathname !== "/api/critique/package") return false;
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const body = await readJsonBody(request);
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const critiqueInput = input as CritiquePackageInput;
  const critique = critiqueContentPackage(critiqueInput);
  await writeCritiqueProjectFile({
    projectId: critiqueInput.projectId,
    critique,
  });

  sendJson(response, 200, { ok: true, critique });
  return true;
}
