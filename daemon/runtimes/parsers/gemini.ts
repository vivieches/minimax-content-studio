import type { RuntimeEventSink, RuntimeParser } from "../types";
import { createLineBufferedParser, errorEvent, extractErrorMessage, isRecord } from "./shared";

export function createGeminiParser(onEvent: RuntimeEventSink): RuntimeParser {
  return createLineBufferedParser((line) => {
    try {
      parseGeminiEvent(JSON.parse(line), onEvent);
    } catch {
      onEvent({ type: "raw", line });
    }
  });
}

export function parseGeminiEvent(obj: unknown, onEvent: RuntimeEventSink) {
  if (!isRecord(obj)) return;

  if (obj.type === "init") {
    onEvent({
      type: "start",
      label: "initializing",
      model: typeof obj.model === "string" ? obj.model : undefined,
      raw: obj,
    });
    return;
  }

  if (obj.type === "message" && obj.role === "assistant" && typeof obj.content === "string" && obj.content) {
    onEvent({ type: "delta", text: obj.content, raw: obj });
    return;
  }

  if (obj.type === "result") {
    if (isRecord(obj.stats)) onEvent({ type: "usage", usage: obj.stats, raw: obj });
    onEvent({ type: "end", status: "completed", raw: obj });
    return;
  }

  if (obj.type === "error") {
    onEvent(errorEvent(extractErrorMessage(obj.error ?? obj.message, "Gemini error"), obj));
  }
}
