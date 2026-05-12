import { describe, expect, it } from "vitest";
import { classifyConnectionError, validateBaseUrl } from "./connection";

describe("daemon connection guards", () => {
  it("allows loopback providers for local-first workflows", async () => {
    await expect(validateBaseUrl("http://127.0.0.1:11434/v1")).resolves.toEqual({ ok: true });
    await expect(validateBaseUrl("http://localhost:1234/v1")).resolves.toEqual({ ok: true });
    await expect(validateBaseUrl("http://[::1]:11434/v1")).resolves.toEqual({ ok: true });
  });

  it("blocks direct remote private IPs", async () => {
    const result = await validateBaseUrl("http://192.168.0.10:8080/v1");
    expect(result.ok).toBe(false);
  });

  it("blocks direct remote reserved and multicast IP ranges", async () => {
    await expect(validateBaseUrl("http://100.64.0.1:8080/v1")).resolves.toMatchObject({ ok: false });
    await expect(validateBaseUrl("http://224.0.0.1:8080/v1")).resolves.toMatchObject({ ok: false });
    await expect(validateBaseUrl("http://[fe80::1]:8080/v1")).resolves.toMatchObject({ ok: false });
    await expect(validateBaseUrl("http://[ff02::1]:8080/v1")).resolves.toMatchObject({ ok: false });
    await expect(validateBaseUrl("http://[::ffff:192.168.0.10]:8080/v1")).resolves.toMatchObject({ ok: false });
  });

  it("categorizes common provider failures", () => {
    expect(classifyConnectionError({ status: 401 })).toBe("auth_failed");
    expect(classifyConnectionError({ status: 429 })).toBe("rate_limited");
    expect(classifyConnectionError({ message: "model not found" })).toBe("not_found_model");
    expect(classifyConnectionError({ message: "timeout exceeded" })).toBe("timeout");
    expect(classifyConnectionError({ message: "HTTP 401 Unauthorized" })).toBe("auth_failed");
    expect(classifyConnectionError({ message: "ECONNREFUSED 127.0.0.1" })).toBe("upstream_unavailable");
  });
});
