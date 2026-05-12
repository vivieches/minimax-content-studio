import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import type { IncomingMessage } from "http";
import { dirname, join } from "path";

import type { DaemonContext } from "@/daemon/context";

const TOKEN_FILE = "local-token";
const COOKIE_NAME = "open_studio_local_token";
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type LocalAuthResult =
  | { ok: true; mode: "cookie" | "hmac" }
  | { ok: false; status: 401 | 403; error: "local_auth_required" | "invalid_local_origin" | "invalid_local_signature" };

export async function getOrCreateLocalToken(context: DaemonContext) {
  const tokenPath = localTokenPath(context);
  const existing = await readFile(tokenPath, "utf8").catch(() => "");
  if (isToken(existing.trim())) return existing.trim();

  const token = randomBytes(32).toString("hex");
  await mkdir(dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, `${token}\n`, { encoding: "utf8", mode: 0o600 });
  return token;
}

export async function createLocalSessionCookie(context: DaemonContext) {
  const token = await getOrCreateLocalToken(context);
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    },
  };
}

export async function verifyLocalRequest(request: Request, context: DaemonContext, body: Buffer = Buffer.alloc(0)): Promise<LocalAuthResult> {
  if (!validateLocalOrigin(request)) {
    return { ok: false, status: 403, error: "invalid_local_origin" };
  }

  const token = await getOrCreateLocalToken(context);
  const cookieToken = parseCookies(request.headers.get("cookie") ?? "")[COOKIE_NAME];
  if (cookieToken && safeEqual(cookieToken, token)) return { ok: true, mode: "cookie" };

  const timestamp = request.headers.get("x-open-studio-local-timestamp") ?? "";
  const signature = request.headers.get("x-open-studio-local-signature") ?? "";
  if (!timestamp || !signature) {
    return { ok: false, status: 401, error: "local_auth_required" };
  }

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, status: 401, error: "invalid_local_signature" };
  }

  const expected = signLocalRequest({
    token,
    method: request.method,
    path: new URL(request.url).pathname,
    body,
    timestamp,
  });

  return safeEqual(signature, expected)
    ? { ok: true, mode: "hmac" }
    : { ok: false, status: 401, error: "invalid_local_signature" };
}

export async function verifyLocalNodeRequest(
  request: IncomingMessage,
  url: URL,
  context: DaemonContext,
  body: Buffer = Buffer.alloc(0),
): Promise<LocalAuthResult> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return verifyLocalRequest(
    new Request(url.toString(), {
      method: request.method ?? "GET",
      headers,
    }),
    context,
    body,
  );
}

export function validateLocalOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    if (!isLocalHost(requestUrl.hostname) || !isLocalHost(originUrl.hostname)) return false;
    return originUrl.protocol === requestUrl.protocol && normalizeHost(originUrl.hostname) === normalizeHost(requestUrl.hostname);
  } catch {
    return false;
  }
}

export function localAuthHeaders(input: {
  contextToken: string;
  method: string;
  path: string;
  body?: Buffer | string;
  timestamp?: string;
}) {
  const timestamp = input.timestamp ?? String(Date.now());
  const body = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : input.body ?? Buffer.alloc(0);
  return {
    "x-open-studio-local-timestamp": timestamp,
    "x-open-studio-local-signature": signLocalRequest({
      token: input.contextToken,
      method: input.method,
      path: input.path,
      body,
      timestamp,
    }),
  };
}

function signLocalRequest(input: { token: string; method: string; path: string; body: Buffer; timestamp: string }) {
  const bodyHash = createHash("sha256").update(input.body).digest("hex");
  const message = `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${bodyHash}`;
  return createHmac("sha256", input.token).update(message).digest("hex");
}

function parseCookies(header: string) {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey || rawValue.length === 0) continue;
    out[rawKey] = decodeURIComponent(rawValue.join("="));
  }
  return out;
}

function localTokenPath(context: DaemonContext) {
  return join(context.daemonDir, TOKEN_FILE);
}

function isToken(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}

function isLocalHost(hostname: string) {
  const host = normalizeHost(hostname);
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function normalizeHost(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
