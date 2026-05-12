import type { IncomingMessage, ServerResponse } from "http";

import type { DaemonContext } from "../context";
import {
  createProject,
  deleteProject,
  deleteProjectFile,
  getProject,
  listProjectFiles,
  listProjects,
  readProjectFile,
  updateProject,
  writeProjectFile,
} from "../projects/store";

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

function decodePathname(pathname: string) {
  return decodeURIComponent(pathname);
}

function splitProjectPath(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "projects") return null;
  return {
    projectId: parts[2],
    rest: parts.slice(3),
  };
}

export async function handleProjectRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  context: DaemonContext,
  url: URL,
) {
  if (url.pathname === "/api/projects") {
    if (request.method === "GET") {
      sendJson(response, 200, { projects: await listProjects(context) });
      return true;
    }
    if (request.method === "POST") {
      const project = await createProject(context, await readJsonBody(request));
      sendJson(response, 200, { project });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const parsed = splitProjectPath(url);
  if (!parsed?.projectId) return false;

  const projectId = decodePathname(parsed.projectId);
  const filePrefix = `/api/projects/${parsed.projectId}/files/`;

  if (parsed.rest.length === 0) {
    if (request.method === "GET") {
      const project = await getProject(context, projectId);
      if (!project) sendJson(response, 404, { ok: false, error: "project_not_found" });
      else sendJson(response, 200, { project });
      return true;
    }
    if (request.method === "PATCH") {
      const project = await updateProject(context, projectId, await readJsonBody(request));
      if (!project) sendJson(response, 404, { ok: false, error: "project_not_found" });
      else sendJson(response, 200, { project });
      return true;
    }
    if (request.method === "DELETE") {
      await deleteProject(context, projectId);
      sendJson(response, 200, { ok: true });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (parsed.rest.length === 1 && parsed.rest[0] === "files") {
    if (request.method === "GET") {
      sendJson(response, 200, { files: await listProjectFiles(context, projectId) });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  if (url.pathname.startsWith(filePrefix)) {
    const relPath = decodePathname(url.pathname.slice(filePrefix.length));
    if (request.method === "PUT") {
      const file = await writeProjectFile(context, projectId, relPath, await readBody(request));
      sendJson(response, 200, { file });
      return true;
    }
    if (request.method === "GET") {
      const { file, bytes } = await readProjectFile(context, projectId, relPath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": file.mime,
      });
      response.end(bytes);
      return true;
    }
    if (request.method === "DELETE") {
      await deleteProjectFile(context, projectId, relPath);
      sendJson(response, 200, { ok: true });
      return true;
    }
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  return false;
}
