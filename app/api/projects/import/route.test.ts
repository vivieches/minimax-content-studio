import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createZip } from "@/daemon/export/zip";

describe("POST /api/projects/import", () => {
  let storageDir: string;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-import-route-"));
    vi.resetModules();
    vi.doMock("@/lib/storage/db", () => ({ DATA_DIR: storageDir }));
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
    vi.doUnmock("@/lib/storage/db");
    vi.resetModules();
  });

  it("requires a local token before importing an archive", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ archiveBase64: "Zm9v" }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("local_auth_required");
  });

  it("imports a professional export zip into a new project", async () => {
    const { createDaemonContext } = await import("@/daemon/context");
    const { createLocalSessionCookie } = await import("@/daemon/security/localAuth");
    const { POST } = await import("./route");
    const context = createDaemonContext({ storageDir });
    const session = await createLocalSessionCookie(context);
    const archive = createZip([{ name: "project-files/files/package.json", data: Buffer.from('{"title":"Pacote"}') }]);

    const response = await POST(
      new Request("http://localhost/api/projects/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
          cookie: `${session.name}=${session.value}`,
        },
        body: JSON.stringify({ sourceName: "package.zip", archiveBase64: archive.toString("base64") }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.project.name).toBe("Imported package");
    expect(json.files).toEqual([expect.objectContaining({ path: "files/package.json" })]);
  });
});
