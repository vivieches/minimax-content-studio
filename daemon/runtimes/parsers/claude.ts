import type { RuntimeEventSink, RuntimeParser } from "../types";
import { createLineBufferedParser, errorEvent, extractErrorMessage, isRecord, stringifyContent } from "./shared";

export function createClaudeParser(onEvent: RuntimeEventSink): RuntimeParser {
  return createLineBufferedParser((line) => {
    try {
      parseClaudeEvent(JSON.parse(line), onEvent);
    } catch {
      onEvent({ type: "raw", line });
    }
  });
}

export function parseClaudeEvent(obj: unknown, onEvent: RuntimeEventSink) {
  if (!isRecord(obj)) return;

  if (obj.type === "system" && obj.subtype === "init") {
    onEvent({
      type: "start",
      label: "initializing",
      model: typeof obj.model === "string" ? obj.model : undefined,
      raw: obj,
    });
    return;
  }

  if (obj.type === "system" && obj.subtype === "status") {
    onEvent({ type: "status", label: typeof obj.status === "string" ? obj.status : "working", raw: obj });
    return;
  }

  if (obj.type === "stream_event" && isRecord(obj.event)) {
    parseClaudeStreamEvent(obj.event, onEvent, obj);
    return;
  }

  if (obj.type === "assistant" && isRecord(obj.message) && Array.isArray(obj.message.content)) {
    for (const block of obj.message.content) {
      if (!isRecord(block)) continue;
      if (block.type === "text" && typeof block.text === "string" && block.text) {
        onEvent({ type: "delta", text: block.text, raw: obj });
      }
      if (block.type === "thinking" && typeof block.thinking === "string" && block.thinking) {
        onEvent({ type: "thinking", text: block.thinking, raw: obj });
      }
      if (block.type === "tool_use") {
        onEvent({
          type: "tool_call",
          id: typeof block.id === "string" ? block.id : undefined,
          name: typeof block.name === "string" ? block.name : "tool",
          input: block.input ?? null,
          raw: obj,
        });
      }
    }
    return;
  }

  if (obj.type === "user" && isRecord(obj.message) && Array.isArray(obj.message.content)) {
    for (const block of obj.message.content) {
      if (!isRecord(block) || block.type !== "tool_result") continue;
      onEvent({
        type: "tool_result",
        toolCallId: typeof block.tool_use_id === "string" ? block.tool_use_id : undefined,
        content: stringifyContent(block.content),
        isError: block.is_error === true,
        raw: obj,
      });
    }
    return;
  }

  if (obj.type === "result") {
    onEvent({ type: "usage", usage: obj.usage ?? null, raw: obj });
    onEvent({ type: "end", status: "completed", raw: obj });
    return;
  }

  if (obj.type === "error") {
    onEvent(errorEvent(extractErrorMessage(obj.error ?? obj.message, "Claude error"), obj));
  }
}

function parseClaudeStreamEvent(event: Record<string, unknown>, onEvent: RuntimeEventSink, raw: unknown) {
  if (event.type === "message_start") {
    onEvent({ type: "status", label: "streaming", raw });
    return;
  }

  if (event.type === "content_block_delta" && isRecord(event.delta)) {
    const delta = event.delta;
    if (delta.type === "text_delta" && typeof delta.text === "string") {
      onEvent({ type: "delta", text: delta.text, raw });
      return;
    }
    if (delta.type === "thinking_delta" && typeof delta.thinking === "string") {
      onEvent({ type: "thinking", text: delta.thinking, raw });
    }
  }
}
