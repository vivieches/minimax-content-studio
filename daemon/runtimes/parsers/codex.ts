import type { RuntimeEventSink, RuntimeParser } from "../types";
import { createLineBufferedParser, errorEvent, extractErrorMessage, isRecord, stringifyContent } from "./shared";

type CodexParserState = {
  toolCalls: Set<string>;
  errorEmitted: boolean;
};

export function createCodexParser(onEvent: RuntimeEventSink): RuntimeParser {
  const state: CodexParserState = { toolCalls: new Set(), errorEmitted: false };
  return createLineBufferedParser((line) => {
    try {
      parseCodexEvent(JSON.parse(line), onEvent, state);
    } catch {
      onEvent({ type: "raw", line });
    }
  });
}

export function parseCodexEvent(obj: unknown, onEvent: RuntimeEventSink, state: CodexParserState = { toolCalls: new Set(), errorEmitted: false }) {
  if (!isRecord(obj)) return;

  if (obj.type === "error" || obj.type === "turn.failed") {
    if (!state.errorEmitted) {
      state.errorEmitted = true;
      onEvent(errorEvent(extractErrorMessage(obj.error ?? obj.message, "Codex error"), obj));
    }
    return;
  }

  if (obj.type === "thread.started") {
    onEvent({ type: "start", label: "initializing", raw: obj });
    return;
  }

  if (obj.type === "turn.started") {
    onEvent({ type: "status", label: "running", raw: obj });
    return;
  }

  if ((obj.type === "item.started" || obj.type === "item.completed") && isRecord(obj.item)) {
    const item = obj.item;
    if (item.type === "command_execution" && typeof item.id === "string") {
      if (!state.toolCalls.has(item.id)) {
        state.toolCalls.add(item.id);
        onEvent({
          type: "tool_call",
          id: item.id,
          name: "Bash",
          input: { command: typeof item.command === "string" ? item.command : "" },
          raw: obj,
        });
      }
      if (obj.type === "item.completed") {
        onEvent({
          type: "tool_result",
          toolCallId: item.id,
          content: stringifyContent(item.aggregated_output ?? ""),
          isError: typeof item.exit_code === "number" ? item.exit_code !== 0 : item.status === "failed",
          raw: obj,
        });
      }
      return;
    }

    if (obj.type === "item.completed" && item.type === "agent_message" && typeof item.text === "string" && item.text) {
      onEvent({ type: "delta", text: item.text, raw: obj });
      return;
    }
  }

  if (obj.type === "message" && obj.role === "assistant" && typeof obj.content === "string") {
    onEvent({ type: "delta", text: obj.content, raw: obj });
    return;
  }

  if (obj.type === "result" && typeof obj.content === "string") {
    onEvent({ type: "delta", text: obj.content, raw: obj });
    return;
  }

  if (obj.type === "turn.completed") {
    if (isRecord(obj.usage)) onEvent({ type: "usage", usage: obj.usage, raw: obj });
    onEvent({ type: "end", status: "completed", raw: obj });
  }
}
