export type RuntimeStreamFormat =
  | "plain"
  | "json-event-stream"
  | "claude-stream-json"
  | "copilot-stream-json"
  | "acp-json-rpc"
  | "pi-rpc"
  | "qoder-stream-json";

export type RuntimeEventCode =
  | "not_found_model"
  | "auth_failed"
  | "rate_limited"
  | "timeout"
  | "agent_spawn_failed"
  | "unknown";

export type NormalizedRuntimeEvent =
  | { type: "start"; label?: string; model?: string; raw?: unknown }
  | { type: "status"; label: string; raw?: unknown }
  | { type: "delta"; text: string; raw?: unknown }
  | { type: "thinking"; text: string; raw?: unknown }
  | { type: "tool_call"; id?: string; name: string; input?: unknown; raw?: unknown }
  | { type: "tool_result"; toolCallId?: string; content: string; isError?: boolean; raw?: unknown }
  | { type: "usage"; usage: unknown; raw?: unknown }
  | { type: "end"; status?: string; raw?: unknown }
  | { type: "error"; code: RuntimeEventCode; message: string; raw?: unknown }
  | { type: "raw"; line: string; raw?: unknown };

export type RuntimeParser = {
  feed: (chunk: string) => void;
  flush: () => void;
};

export type RuntimeEventSink = (event: NormalizedRuntimeEvent) => void;

export type RuntimeCapability =
  | "streaming"
  | "structured_events"
  | "tool_events"
  | "prompt_stdin"
  | "prompt_file"
  | "workspace_write"
  | "network"
  | "bypass_permissions"
  | "resume"
  | "native_skills"
  | "image_generation";

export type RuntimeCapabilityMap = Record<RuntimeCapability, boolean>;
