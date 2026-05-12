import type { RuntimeCapabilityMap, RuntimeStreamFormat } from "./types";

type CapabilityAgent = {
  id: string;
  promptViaStdin: boolean;
  permissionMode: string;
  streamFormat: RuntimeStreamFormat;
};

export function capabilitiesForAgent(agent: CapabilityAgent): RuntimeCapabilityMap {
  const structured =
    agent.streamFormat !== "plain" ||
    agent.id === "claude" ||
    agent.id === "codex" ||
    agent.id === "gemini" ||
    agent.id === "opencode";

  return {
    streaming: agent.streamFormat !== "plain",
    structured_events: structured,
    tool_events: ["claude", "codex", "opencode", "cursor-agent", "copilot", "qoder"].includes(agent.id),
    prompt_stdin: agent.promptViaStdin,
    prompt_file: true,
    workspace_write: agent.permissionMode === "workspace-write" || agent.permissionMode === "bypassPermissions" || agent.permissionMode === "dangerous",
    network: agent.id === "codex" || agent.permissionMode === "dangerous" || agent.permissionMode === "bypassPermissions",
    bypass_permissions: agent.permissionMode === "bypassPermissions" || agent.permissionMode === "dangerous",
    resume: ["claude", "codex", "gemini", "opencode"].includes(agent.id),
    native_skills: agent.id === "claude" || agent.id === "codex",
    image_generation: agent.id === "codex",
  };
}
