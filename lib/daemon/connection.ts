import { lookup } from "dns/promises";
import { isIP } from "net";

export type ConnectionErrorKind =
  | "auth_failed"
  | "rate_limited"
  | "not_found_model"
  | "invalid_base_url"
  | "forbidden"
  | "upstream_unavailable"
  | "timeout"
  | "unknown";

function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith("[") && lower.endsWith("]") ? lower.slice(1, -1) : lower;
}

function parseIpv4(hostname: string): [number, number, number, number] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const parsed = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    return value >= 0 && value <= 255 ? value : null;
  });
  if (parsed.some((part) => part === null)) return null;
  return parsed as [number, number, number, number];
}

function ipv4MappedToDotted(hostname: string): string | null {
  const host = normalizeHost(hostname);
  const mapped = /^::ffff:(.+)$/i.exec(host)?.[1];
  if (!mapped) return null;
  if (parseIpv4(mapped)) return mapped;

  const hexParts = mapped.split(":");
  if (hexParts.length !== 2 || !hexParts.every((part) => /^[0-9a-f]{1,4}$/i.test(part))) return null;
  const [hi, lo] = hexParts;
  if (!hi || !lo) return null;

  const value = (Number.parseInt(hi, 16) << 16) | Number.parseInt(lo, 16);
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

function isLoopbackHost(hostname: string): boolean {
  const clean = normalizeHost(hostname);
  if (clean === "localhost" || clean === "::1") return true;
  const ipv4 = parseIpv4(clean) ?? parseIpv4(ipv4MappedToDotted(clean) ?? "");
  return Boolean(ipv4 && ipv4[0] === 127);
}

function isBlockedIpv4(address: string): boolean {
  const ipv4 = parseIpv4(address);
  if (!ipv4) return false;
  const [a, b] = ipv4;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isBlockedExternalAddress(address: string): boolean {
  const clean = normalizeHost(address);
  const mapped = ipv4MappedToDotted(clean);
  if (mapped) return isBlockedIpv4(mapped);
  if (isBlockedIpv4(clean)) return true;
  if (clean === "::" || clean === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(clean)) return true;
  if (/^fe[89ab][0-9a-f]:/i.test(clean)) return true;
  if (/^ff[0-9a-f]{2}:/i.test(clean)) return true;
  return false;
}

export async function validateBaseUrl(rawUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Base URL is not a valid URL." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Base URL must use http or https." };
  }

  if (isLoopbackHost(url.hostname)) return { ok: true };

  if (isIP(normalizeHost(url.hostname)) && isBlockedExternalAddress(url.hostname)) {
    return { ok: false, error: "Remote private, link-local and reserved IP ranges are blocked." };
  }

  try {
    const records = await lookup(url.hostname, { all: true, verbatim: true });
    if (records.some((record) => isBlockedExternalAddress(record.address))) {
      return { ok: false, error: "Base URL resolves to a private or reserved network address." };
    }
  } catch {
    return { ok: false, error: "Base URL hostname could not be resolved." };
  }

  return { ok: true };
}

export function classifyConnectionError(input: {
  status?: number;
  message?: string;
  code?: string;
}): ConnectionErrorKind {
  const message = `${input.message ?? ""} ${input.code ?? ""}`.toLowerCase();
  const status = input.status ?? Number(/\b(?:http|status)\s*[:=]?\s*(\d{3})\b/i.exec(message)?.[1]);
  if (
    status === 401 ||
    message.includes("api key") ||
    message.includes("unauthorized") ||
    message.includes("invalid_api_key") ||
    message.includes("incorrect api key") ||
    message.includes("missing api key")
  ) {
    return "auth_failed";
  }
  if (status === 403 || message.includes("forbidden") || message.includes("permission denied")) return "forbidden";
  if (
    status === 404 ||
    (message.includes("model") && (message.includes("not found") || message.includes("unknown") || message.includes("does not exist"))) ||
    message.includes("deploymentnotfound")
  ) {
    return "not_found_model";
  }
  if (status === 429 || message.includes("rate limit") || message.includes("too many requests")) return "rate_limited";
  if (status && status >= 500) return "upstream_unavailable";
  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("abort") ||
    message.includes("etimedout")
  ) {
    return "timeout";
  }
  if (message.includes("invalid") && message.includes("url")) return "invalid_base_url";
  if (message.includes("enotfound") || message.includes("econnrefused") || message.includes("fetch failed")) {
    return "upstream_unavailable";
  }
  return "unknown";
}
