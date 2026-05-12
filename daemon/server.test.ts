import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";

import { startDaemonServer, type StartedDaemonServer } from "./server";
import { getOrCreateLocalToken, localAuthHeaders } from "./security/localAuth";

describe("daemon server", () => {
  const cleanupDirs: string[] = [];
  let server: StartedDaemonServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
    for (const dir of cleanupDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("serves health on an ephemeral port", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "open-studio-daemon-"));
    cleanupDirs.push(storageDir);

    server = await startDaemonServer({ port: 0, storageDir });
    const response = await fetch(`${server.url}/api/health`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      service: "open-studio-daemon",
      mode: "local-daemon",
      storageDir,
    });
    expect(json.capabilities).toContain("logs");
  });

  it("serves status and log tail", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "open-studio-daemon-"));
    cleanupDirs.push(storageDir);

    server = await startDaemonServer({ port: 0, storageDir });
    const status = await fetch(`${server.url}/api/status`).then((response) => response.json());
    const logs = await fetch(`${server.url}/api/logs?tail=5`).then((response) => response.json());

    expect(status).toMatchObject({
      ok: true,
      service: "open-studio-daemon",
      projectsDir: join(storageDir, "projects"),
    });
    expect(status.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(logs.ok).toBe(true);
    expect(Array.isArray(logs.lines)).toBe(true);
  });

  it("serves project and file routes", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "open-studio-daemon-"));
    cleanupDirs.push(storageDir);

    server = await startDaemonServer({ port: 0, storageDir });
    const createBody = JSON.stringify({ id: "proj_http", name: "HTTP project" });
    const writeBody = "roteiro";
    const created = await fetch(`${server.url}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await signedHeaders(server, "POST", "/api/projects", createBody)),
      },
      body: createBody,
    }).then((response) => response.json());
    const written = await fetch(`${server.url}/api/projects/proj_http/files/files/script.md`, {
      method: "PUT",
      headers: await signedHeaders(server, "PUT", "/api/projects/proj_http/files/files/script.md", writeBody),
      body: writeBody,
    }).then((response) => response.json());
    const fileText = await fetch(`${server.url}/api/projects/proj_http/files/files/script.md`).then((response) =>
      response.text(),
    );
    const files = await fetch(`${server.url}/api/projects/proj_http/files`).then((response) => response.json());

    expect(created.project).toMatchObject({ id: "proj_http", name: "HTTP project" });
    expect(written.file).toMatchObject({ path: "files/script.md", kind: "markdown" });
    expect(fileText).toBe("roteiro");
    expect(files.files).toEqual([expect.objectContaining({ path: "files/script.md" })]);
  });

  it("requires local auth for privileged project mutations", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "open-studio-daemon-"));
    cleanupDirs.push(storageDir);

    server = await startDaemonServer({ port: 0, storageDir });
    const response = await fetch(`${server.url}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "proj_unauth" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("local_auth_required");
  });

  it("serves run lifecycle routes", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "open-studio-daemon-"));
    cleanupDirs.push(storageDir);

    server = await startDaemonServer({ port: 0, storageDir });
    const created = await fetch(`${server.url}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "run_http", projectId: "proj_http", kind: "package" }),
    }).then((response) => response.json());
    const running = await fetch(`${server.url}/api/runs/run_http`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "running" }),
    }).then((response) => response.json());
    const cancelled = await fetch(`${server.url}/api/runs/run_http/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal: "SIGINT" }),
    }).then((response) => response.json());
    const result = await fetch(`${server.url}/api/runs/run_http`).then((response) => response.json());

    expect(created.run).toMatchObject({ id: "run_http", status: "queued" });
    expect(running.run).toMatchObject({ id: "run_http", status: "running" });
    expect(cancelled.run).toMatchObject({ id: "run_http", status: "cancelled", cancelSignal: "SIGINT" });
    expect(result.events).toEqual([
      expect.objectContaining({ type: "run.created" }),
      expect.objectContaining({ type: "run.status" }),
      expect.objectContaining({ type: "run.cancelled" }),
    ]);
  });
});

async function signedHeaders(server: StartedDaemonServer, method: string, path: string, body = "") {
  const token = await getOrCreateLocalToken(server.context);
  return localAuthHeaders({
    contextToken: token,
    method,
    path,
    body,
  });
}
