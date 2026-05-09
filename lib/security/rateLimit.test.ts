import { describe, it, expect } from "vitest";
import { withRateLimitHeaders, validatePayloadSize, PAYLOAD_LIMITS } from "./rateLimit";
import { NextResponse } from "next/server";

describe("withRateLimitHeaders", () => {
  it("adds rate limit headers", () => {
    const response = NextResponse.json({ ok: true });
    const result = withRateLimitHeaders(response, { limit: 100, remaining: 95, reset: 1234567890 });

    expect(result.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(result.headers.get("X-RateLimit-Remaining")).toBe("95");
    expect(result.headers.get("X-RateLimit-Reset")).toBe("1234567890");
  });

  it("uses defaults when no opts provided", () => {
    const response = NextResponse.json({ ok: true });
    const result = withRateLimitHeaders(response);

    expect(result.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(result.headers.get("X-RateLimit-Remaining")).toBe("60");
  });
});

describe("validatePayloadSize", () => {
  it("returns null for acceptable size", () => {
    const request = new Request("http://localhost", {
      headers: { "content-length": "100" },
    });
    expect(validatePayloadSize(request, PAYLOAD_LIMITS.briefing)).toBeNull();
  });

  it("returns error for oversized payload", () => {
    const request = new Request("http://localhost", {
      headers: { "content-length": String(PAYLOAD_LIMITS.briefing + 1) },
    });
    const result = validatePayloadSize(request, PAYLOAD_LIMITS.briefing);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(413);
  });

  it("returns null when content-length is missing", () => {
    const request = new Request("http://localhost");
    expect(validatePayloadSize(request, PAYLOAD_LIMITS.briefing)).toBeNull();
  });

  it("returns null for invalid content-length", () => {
    const request = new Request("http://localhost", {
      headers: { "content-length": "not-a-number" },
    });
    expect(validatePayloadSize(request, PAYLOAD_LIMITS.briefing)).toBeNull();
  });
});
