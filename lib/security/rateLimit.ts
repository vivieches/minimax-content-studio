import { NextResponse } from "next/server";

/**
 * Adds rate-limiting headers to a NextResponse.
 * Client-side rate limiting for now — server-side store can be added later.
 */
export function withRateLimitHeaders(
  response: NextResponse,
  opts?: { remaining?: number; limit?: number; reset?: number }
): NextResponse {
  const limit = opts?.limit ?? 60;
  const remaining = opts?.remaining ?? limit;
  const reset = opts?.reset ?? Math.floor(Date.now() / 1000) + 60;

  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(reset));
  return response;
}

/**
 * Validates request body size. Returns an error response if too large,
 * or null if the size is acceptable.
 */
export function validatePayloadSize(
  request: Request,
  maxBytes: number
): NextResponse | null {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const length = Number(contentLength);
    if (!Number.isNaN(length) && length > maxBytes) {
      return NextResponse.json(
        { error: `Payload too large. Maximum size is ${maxBytes} bytes.` },
        { status: 413 }
      );
    }
  }
  return null;
}

/** Max payload sizes in bytes */
export const PAYLOAD_LIMITS = {
  briefing: 1 * 1024 * 1024, // 1MB for text briefings
  upload: 10 * 1024 * 1024,  // 10MB for file uploads
} as const;