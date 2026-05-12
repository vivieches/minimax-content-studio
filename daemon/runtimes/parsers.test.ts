import { describe, expect, it } from "vitest";

import { collectTextFromEvents, createRuntimeParser, firstErrorFromEvents, parseRuntimeOutput } from "./parsers";

describe("runtime parsers", () => {
  it("normalizes Codex model errors", () => {
    const events = parseRuntimeOutput(
      "codex",
      "json-event-stream",
      JSON.stringify({
        type: "error",
        message: "The 'gpt-5.5' model requires a newer version of Codex.",
      }),
    );

    expect(firstErrorFromEvents(events)).toMatchObject({
      type: "error",
      code: "not_found_model",
      message: "The 'gpt-5.5' model requires a newer version of Codex.",
    });
  });

  it("collects Codex assistant text and tool events", () => {
    const events = parseRuntimeOutput(
      "codex",
      "json-event-stream",
      [
        JSON.stringify({ type: "turn.started" }),
        JSON.stringify({ type: "item.started", item: { type: "command_execution", id: "tool_1", command: "echo ok" } }),
        JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Título forte" } }),
      ].join("\n"),
    );

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "status", label: "running" }),
        expect.objectContaining({ type: "tool_call", name: "Bash" }),
        expect.objectContaining({ type: "delta", text: "Título forte" }),
      ]),
    );
    expect(collectTextFromEvents(events)).toBe("Título forte");
  });

  it("collects Claude stream deltas", () => {
    const events = parseRuntimeOutput(
      "claude",
      "claude-stream-json",
      JSON.stringify({
        type: "stream_event",
        event: { type: "content_block_delta", delta: { type: "text_delta", text: "Olá" } },
      }),
    );

    expect(collectTextFromEvents(events)).toBe("Olá");
  });

  it("buffers plain text until flush", () => {
    const events: unknown[] = [];
    const parser = createRuntimeParser("qwen", "plain", (event) => events.push(event));
    parser.feed("texto ");
    parser.feed("direto\n");
    parser.flush();

    expect(events).toEqual([expect.objectContaining({ type: "delta", text: "texto direto" })]);
  });
});
