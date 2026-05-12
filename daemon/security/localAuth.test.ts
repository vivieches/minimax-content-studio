import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDaemonContext, type DaemonContext } from "@/daemon/context";

import { createLocalSessionCookie, getOrCreateLocalToken, localAuthHeaders, verifyLocalRequest } from "./localAuth";

describe("local privileged auth", () => {
  let storageDir: string;
  let context: DaemonContext;

  beforeEach(() => {
    storageDir = mkdtempSync(join(tmpdir(), "open-studio-auth-"));
    context = createDaemonContext({ storageDir });
  });

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("creates a stable local token", async () => {
    const first = await getOrCreateLocalToken(context);
    const second = await getOrCreateLocalToken(context);

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it("allows same-origin local session cookies", async () => {
    const session = await createLocalSessionCookie(context);
    const request = new Request("http://localhost/api/desktop/reveal", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        cookie: `${session.name}=${session.value}`,
      },
      body: "{}",
    });

    await expect(verifyLocalRequest(request, context, Buffer.from("{}"))).resolves.toEqual({ ok: true, mode: "cookie" });
  });

  it("allows HMAC signed requests and rejects remote origins", async () => {
    const token = await getOrCreateLocalToken(context);
    const body = Buffer.from('{"target":"storage"}');
    const headers = localAuthHeaders({
      contextToken: token,
      method: "POST",
      path: "/api/desktop/reveal",
      body,
      timestamp: String(Date.now()),
    });

    await expect(
      verifyLocalRequest(
        new Request("http://127.0.0.1/api/desktop/reveal", {
          method: "POST",
          headers: { origin: "http://127.0.0.1", ...headers },
          body,
        }),
        context,
        body,
      ),
    ).resolves.toEqual({ ok: true, mode: "hmac" });

    await expect(
      verifyLocalRequest(
        new Request("http://localhost/api/desktop/reveal", {
          method: "POST",
          headers: { origin: "https://evil.example", ...headers },
          body,
        }),
        context,
        body,
      ),
    ).resolves.toMatchObject({ ok: false, error: "invalid_local_origin" });
  });
});
