import type { RuntimeEventSink, RuntimeParser } from "../types";

export function createPlainParser(onEvent: RuntimeEventSink): RuntimeParser {
  let text = "";
  return {
    feed(chunk: string) {
      text += chunk;
    },
    flush() {
      const cleaned = text.trim();
      if (cleaned) onEvent({ type: "delta", text: cleaned });
    },
  };
}
