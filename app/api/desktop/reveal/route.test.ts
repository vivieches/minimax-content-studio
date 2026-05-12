import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /api/desktop/reveal", () => {
  let storageDir: string;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-reveal-route-"));
    vi.resetModules();
    vi.doMock("@/lib/storage/db", () => ({ DATA_DIR: storageDir }));
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
    vi.doUnmock("@/lib/storage/db");
    vi.resetModules();
  });

  it("requires local auth for desktop bridge access", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/desktop/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ target: "storage", dryRun: true }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("local_auth_required");
  });

  it("resolves a storage path in dry-run mode with a local session", async () => {
    const { createDaemonContext } = await import("@/daemon/context");
    const { createLocalSessionCookie } = await import("@/daemon/security/localAuth");
    const { POST } = await import("./route");
    const context = createDaemonContext({ storageDir });
    const session = await createLocalSessionCookie(context);

    const response = await POST(
      new Request("http://localhost/api/desktop/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
          cookie: `${session.name}=${session.value}`,
        },
        body: JSON.stringify({ target: "storage", dryRun: true }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ ok: true, target: "storage", path: storageDir, opened: false });
  });
});
