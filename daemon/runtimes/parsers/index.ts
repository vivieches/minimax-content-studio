import type { NormalizedRuntimeEvent, RuntimeEventSink, RuntimeParser, RuntimeStreamFormat } from "../types";
import { createClaudeParser } from "./claude";
import { createCodexParser } from "./codex";
import { createGeminiParser } from "./gemini";
import { createPlainParser } from "./plain";
import { collectTextFromEvents, firstErrorFromEvents } from "./shared";

export { collectTextFromEvents, firstErrorFromEvents };

export function createRuntimeParser(
  agentId: string,
  streamFormat: RuntimeStreamFormat,
  onEvent: RuntimeEventSink,
): RuntimeParser {
  if (streamFormat === "claude-stream-json") return createClaudeParser(onEvent);
  if (agentId === "codex" || streamFormat === "json-event-stream") {
    if (agentId === "gemini") return createGeminiParser(onEvent);
    return createCodexParser(onEvent);
  }
  if (agentId === "gemini") return createGeminiParser(onEvent);
  return createPlainParser(onEvent);
}

export function parseRuntimeOutput(agentId: string, streamFormat: RuntimeStreamFormat, stdout: string) {
  const events: NormalizedRuntimeEvent[] = [];
  const parser = createRuntimeParser(agentId, streamFormat, (event) => events.push(event));
  parser.feed(stdout);
  parser.flush();
  return events;
}
