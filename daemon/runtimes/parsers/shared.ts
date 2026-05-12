import type { NormalizedRuntimeEvent, RuntimeEventCode } from "../types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function safeJsonParse(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function extractErrorMessage(value: unknown, fallback = "Agent error"): string {
  if (typeof value === "string") {
    const parsed = safeJsonParse(value);
    if (parsed && typeof parsed === "object") return extractErrorMessage(parsed, value);
    return value.trim() || fallback;
  }
  if (isRecord(value)) {
    for (const key of ["detail", "message", "error", "data", "turn", "status"]) {
      const message = extractErrorMessage(value[key], "");
      if (message) return message;
    }
    if (typeof value.name === "string" && value.name) return value.name;
  }
  return fallback;
}

export function classifyAgentError(message: string): RuntimeEventCode {
  if (/rate.?limit|too many requests|429/i.test(message)) return "rate_limited";
  if (/unauthorized|invalid api key|forbidden|auth|login|token/i.test(message)) return "auth_failed";
  if (
    /model|deployment/i.test(message) &&
    /not found|unknown|invalid|404|requires a newer version|not supported|no access|does not support/i.test(message)
  ) {
    return "not_found_model";
  }
  return "unknown";
}

export function errorEvent(message: string, raw?: unknown): NormalizedRuntimeEvent {
  return {
    type: "error",
    code: classifyAgentError(message),
    message,
    raw,
  };
}

export function collectTextFromEvents(events: NormalizedRuntimeEvent[]) {
  return events
    .filter((event): event is Extract<NormalizedRuntimeEvent, { type: "delta" }> => event.type === "delta")
    .map((event) => event.text)
    .join("")
    .trim();
}

export function firstErrorFromEvents(events: NormalizedRuntimeEvent[]) {
  return events.find((event): event is Extract<NormalizedRuntimeEvent, { type: "error" }> => event.type === "error");
}

export function createLineBufferedParser(onLine: (line: string) => void) {
  let buffer = "";
  return {
    feed(chunk: string) {
      buffer += chunk;
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) onLine(line);
      }
    },
    flush() {
      const line = buffer.trim();
      buffer = "";
      if (line) onLine(line);
    },
  };
}
