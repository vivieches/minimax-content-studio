import { execFile, spawn } from "child_process";
import { existsSync, readdirSync } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { capabilitiesForAgent } from "../../daemon/runtimes/capabilities";
import { preparePromptInput } from "../../daemon/runtimes/invocation";
import {
  collectTextFromEvents,
  createRuntimeParser,
  firstErrorFromEvents,
  parseRuntimeOutput,
} from "../../daemon/runtimes/parsers";
import type { NormalizedRuntimeEvent, RuntimeCapabilityMap } from "../../daemon/runtimes/types";
import { agentCliEnvForAgent, AGENT_BIN_ENV_KEYS, type AgentCliEnv } from "./agentConfig";

const execFileAsync = promisify(execFile);

export type AgentPermissionMode = "default" | "workspace-write" | "bypassPermissions" | "dangerous";

export interface AgentModelOption {
  id: string;
  label: string;
}

export interface AgentBuildInput {
  model?: string;
  reasoning?: string;
  permissionMode?: AgentPermissionMode;
  prompt?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  bin: string;
  fallbackBins?: string[];
  versionArgs?: string[];
  fallbackModels: string[];
  reasoningOptions?: AgentModelOption[];
  promptViaStdin: boolean;
  permissionMode: AgentPermissionMode;
  streamFormat:
    | "plain"
    | "json-event-stream"
    | "claude-stream-json"
    | "copilot-stream-json"
    | "acp-json-rpc"
    | "pi-rpc"
    | "qoder-stream-json";
  installUrl?: string;
  docsUrl?: string;
  env?: Record<string, string>;
  buildArgs: (input: AgentBuildInput) => string[];
}

export interface AgentInfo extends Omit<AgentDefinition, "buildArgs"> {
  available: boolean;
  version?: string;
  path?: string;
  pathSource?: AgentPathSource;
  commandPreview: string[];
  models: AgentModelOption[];
  capabilities: RuntimeCapabilityMap;
}

export type AgentPathSource = "configured" | "env" | "path" | "well_known" | "fallback";

export interface AgentResolverOptions {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  platform?: NodeJS.Platform;
  pathExists?: (filePath: string) => boolean;
  readDir?: (dirPath: string) => string[];
}

export interface ResolvedAgentExecutable {
  bin: string;
  source: AgentPathSource;
}

const DEFAULT_AGENT_MODEL = "default";
const DEFAULT_REASONING_OPTIONS: AgentModelOption[] = [
  { id: "default", label: "Default" },
  { id: "none", label: "None" },
  { id: "minimal", label: "Minimal" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "XHigh" },
];

function modelList(models: string[]): AgentModelOption[] {
  return models.map((id) => ({
    id,
    label: id === DEFAULT_AGENT_MODEL ? "Default (CLI config)" : id,
  }));
}

function withDefault(models: string[]) {
  return Array.from(new Set([DEFAULT_AGENT_MODEL, ...models]));
}

export const AGENT_DEFS: AgentDefinition[] = [
  {
    id: "claude",
    name: "Claude Code",
    bin: "claude",
    fallbackBins: ["openclaude"],
    versionArgs: ["--version"],
    fallbackModels: withDefault(["sonnet", "opus", "haiku", "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"]),
    promptViaStdin: true,
    permissionMode: "bypassPermissions",
    streamFormat: "claude-stream-json",
    installUrl: "https://docs.anthropic.com/en/docs/claude-code/setup",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code",
    buildArgs: ({ model, permissionMode }) => [
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--permission-mode",
      permissionMode === "bypassPermissions" ? "bypassPermissions" : "default",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
    ],
  },
  {
    id: "codex",
    name: "Codex CLI",
    bin: "codex",
    versionArgs: ["--version"],
    fallbackModels: withDefault([
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.3-codex",
      "gpt-5.2",
      "gpt-5.1",
      "gpt-5.1-codex-mini",
      "gpt-5-codex",
      "gpt-5",
      "o3",
      "o4-mini",
    ]),
    reasoningOptions: DEFAULT_REASONING_OPTIONS,
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "json-event-stream",
    installUrl: "https://github.com/openai/codex",
    docsUrl: "https://developers.openai.com/codex",
    buildArgs: ({ model, reasoning }) => {
      const args = [
        "exec",
        "--json",
        "--skip-git-repo-check",
        "--sandbox",
        "workspace-write",
        "--ephemeral",
        "-c",
        "sandbox_workspace_write.network_access=true",
      ];
      if (process.env.OS_CODEX_DISABLE_PLUGINS !== "0") {
        args.push("--disable", "plugins");
      }
      if (model && model !== DEFAULT_AGENT_MODEL) {
        args.push("--model", model);
      }
      if (reasoning && reasoning !== DEFAULT_AGENT_MODEL) {
        args.push("-c", `model_reasoning_effort="${reasoning}"`);
      }
      return args;
    },
  },
  {
    id: "devin",
    name: "Devin for Terminal",
    bin: "devin",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["adaptive", "swe", "opus", "sonnet", "codex", "gpt", "gemini"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "acp-json-rpc",
    installUrl: "https://cli.devin.ai/docs",
    docsUrl: "https://docs.devin.ai",
    buildArgs: () => ["--permission-mode", "dangerous", "--respect-workspace-trust", "false", "acp"],
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    bin: "gemini",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "json-event-stream",
    installUrl: "https://github.com/google-gemini/gemini-cli",
    docsUrl: "https://github.com/google-gemini/gemini-cli/blob/main/README.md",
    env: { GEMINI_CLI_TRUST_WORKSPACE: "true" },
    buildArgs: ({ model }) => [
      "--output-format",
      "stream-json",
      "--yolo",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    bin: "opencode-cli",
    fallbackBins: ["opencode"],
    versionArgs: ["--version"],
    fallbackModels: withDefault(["anthropic/claude-sonnet-4-5", "openai/gpt-5", "google/gemini-2.5-pro"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "json-event-stream",
    installUrl: "https://opencode.ai/docs",
    docsUrl: "https://github.com/sst/opencode",
    buildArgs: ({ model }) => [
      "run",
      "--format",
      "json",
      "--dangerously-skip-permissions",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
      "-",
    ],
  },
  {
    id: "hermes",
    name: "Hermes",
    bin: "hermes",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["openai-codex:gpt-5.5", "openai-codex:gpt-5.4", "openai-codex:gpt-5.4-mini"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "acp-json-rpc",
    installUrl: "https://github.com/nexu-io/open-design/blob/main/docs/agent-adapters.md",
    docsUrl: "https://hermes-agent.nousresearch.com/docs/",
    buildArgs: () => ["acp", "--accept-hooks"],
  },
  {
    id: "kimi",
    name: "Kimi CLI",
    bin: "kimi",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["kimi-k2-turbo-preview", "moonshot-v1-8k", "moonshot-v1-32k"]),
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "acp-json-rpc",
    installUrl: "https://github.com/MoonshotAI/kimi-cli",
    docsUrl: "https://www.kimi.com/code/docs/en/kimi-cli/guides/getting-started.html",
    buildArgs: () => ["acp"],
  },
  {
    id: "cursor-agent",
    name: "Cursor Agent",
    bin: "cursor-agent",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["auto", "sonnet-4", "sonnet-4-thinking", "gpt-5"]),
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "json-event-stream",
    installUrl: "https://cursor.com/docs/cli/overview",
    docsUrl: "https://docs.cursor.com/en/cli/overview",
    buildArgs: ({ model }) => [
      "--print",
      "--output-format",
      "stream-json",
      "--stream-partial-output",
      "--force",
      "--trust",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
    ],
  },
  {
    id: "qwen",
    name: "Qwen Code",
    bin: "qwen",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["qwen3-coder-plus", "qwen3-coder-flash", "qwen3-coder"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "plain",
    installUrl: "https://github.com/QwenLM/qwen-code",
    docsUrl: "https://qwenlm.github.io/qwen-code-docs/en/index",
    buildArgs: ({ model }) => ["--yolo", ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []), "-"],
  },
  {
    id: "qoder",
    name: "Qoder CLI",
    bin: "qodercli",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["lite", "efficient", "auto", "performance", "ultimate"]),
    promptViaStdin: true,
    permissionMode: "dangerous",
    streamFormat: "qoder-stream-json",
    installUrl: "https://qoder.com/download",
    docsUrl: "https://docs.qoder.com",
    buildArgs: ({ model }) => [
      "-p",
      "--output-format",
      "stream-json",
      "--yolo",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
    ],
  },
  {
    id: "copilot",
    name: "GitHub Copilot CLI",
    bin: "copilot",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["claude-sonnet-4.6", "gpt-5.2"]),
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "copilot-stream-json",
    installUrl: "https://github.com/github/copilot-cli",
    docsUrl: "https://docs.github.com/en/copilot/how-tos/use-copilot-extensions/use-in-cli",
    buildArgs: ({ model }) => [
      "--allow-all-tools",
      "--output-format",
      "json",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
    ],
  },
  {
    id: "pi",
    name: "Pi",
    bin: "pi",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["anthropic/claude-sonnet-4-5", "anthropic/claude-opus-4-5", "openai/gpt-5", "openai/o4-mini", "google/gemini-2.5-pro"]),
    reasoningOptions: DEFAULT_REASONING_OPTIONS,
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "pi-rpc",
    installUrl: "https://github.com/nexu-io/open-design/blob/main/docs/agent-adapters.md",
    docsUrl: "https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md",
    buildArgs: ({ model, reasoning }) => [
      "--mode",
      "rpc",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
      ...(reasoning && reasoning !== DEFAULT_AGENT_MODEL ? ["--thinking", reasoning] : []),
    ],
  },
  {
    id: "kiro",
    name: "Kiro CLI",
    bin: "kiro-cli",
    versionArgs: ["--version"],
    fallbackModels: [DEFAULT_AGENT_MODEL],
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "acp-json-rpc",
    installUrl: "https://kiro.dev",
    docsUrl: "https://kiro.dev/docs/cli/",
    buildArgs: () => ["acp"],
  },
  {
    id: "kilo",
    name: "Kilo",
    bin: "kilo",
    versionArgs: ["--version"],
    fallbackModels: [DEFAULT_AGENT_MODEL],
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "acp-json-rpc",
    installUrl: "https://kilo.ai",
    docsUrl: "https://kilo.ai/docs/cli",
    buildArgs: () => ["acp"],
  },
  {
    id: "vibe",
    name: "Mistral Vibe CLI",
    bin: "vibe-acp",
    versionArgs: ["--version"],
    fallbackModels: [DEFAULT_AGENT_MODEL],
    promptViaStdin: true,
    permissionMode: "workspace-write",
    streamFormat: "acp-json-rpc",
    installUrl: "https://docs.mistral.ai",
    docsUrl: "https://github.com/mistralai/vibe-acp",
    buildArgs: () => [],
  },
  {
    id: "deepseek",
    name: "DeepSeek TUI",
    bin: "deepseek",
    versionArgs: ["--version"],
    fallbackModels: withDefault(["deepseek-v4-pro", "deepseek-v4-flash"]),
    promptViaStdin: false,
    permissionMode: "dangerous",
    streamFormat: "plain",
    installUrl: "https://github.com/deepseek-ai/DeepSeek-TUI",
    docsUrl: "https://github.com/deepseek-ai/DeepSeek-TUI/blob/main/README.md",
    buildArgs: ({ model, prompt }) => [
      "exec",
      "--auto",
      ...(model && model !== DEFAULT_AGENT_MODEL ? ["--model", model] : []),
      prompt || "<prompt>",
    ],
  },
];

function resolverEnv(options: AgentResolverOptions = {}): NodeJS.ProcessEnv {
  return options.env ?? process.env;
}

function resolverPlatform(options: AgentResolverOptions = {}): NodeJS.Platform {
  return options.platform ?? process.platform;
}

function fileExists(filePath: string, options: AgentResolverOptions = {}): boolean {
  return options.pathExists ? options.pathExists(filePath) : existsSync(filePath);
}

function resolveUserScopedHome(raw: string | undefined, home: string): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value === "~") return home;
  if (value.startsWith("~/") || value.startsWith("~\\")) return path.join(home, value.slice(2));
  return path.isAbsolute(value) ? value : null;
}

function childDirs(root: string, options: AgentResolverOptions): string[] {
  if (options.readDir) return options.readDir(root);
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function existingChildBinDirs(root: string, segments: string[], options: AgentResolverOptions): string[] {
  return childDirs(root, options)
    .map((entry) => path.join(root, entry, ...segments))
    .filter((candidate) => fileExists(candidate, options));
}

export function wellKnownUserToolchainBins(options: AgentResolverOptions = {}): string[] {
  const env = resolverEnv(options);
  const home = options.homeDir ?? os.homedir();
  const platform = resolverPlatform(options);
  const dirs: string[] = [];

  const appData = env.APPDATA || (platform === "win32" ? path.join(home, "AppData", "Roaming") : undefined);
  const localAppData = env.LOCALAPPDATA || (platform === "win32" ? path.join(home, "AppData", "Local") : undefined);
  if (appData) dirs.push(path.join(appData, "npm"), path.join(appData, "pnpm"));
  if (localAppData) dirs.push(path.join(localAppData, "pnpm"), path.join(localAppData, "Programs", "Python", "Python312", "Scripts"));

  const vpHome = resolveUserScopedHome(env.VP_HOME, home);
  if (vpHome) dirs.push(path.join(vpHome, "bin"));

  const npmPrefixRaw = env.NPM_CONFIG_PREFIX ?? env.npm_config_prefix;
  if (typeof npmPrefixRaw === "string" && npmPrefixRaw.trim()) {
    dirs.push(path.join(npmPrefixRaw.trim(), "bin"));
  }

  dirs.push(
    path.join(home, ".local", "bin"),
    path.join(home, ".vite-plus", "bin"),
    path.join(home, ".opencode", "bin"),
    path.join(home, ".bun", "bin"),
    path.join(home, ".volta", "bin"),
    path.join(home, ".asdf", "shims"),
    path.join(home, "Library", "pnpm"),
    path.join(home, ".cargo", "bin"),
    path.join(home, ".npm-global", "bin"),
    path.join(home, ".npm-packages", "bin"),
    path.join(home, "scoop", "shims")
  );

  if (env.ChocolateyInstall) dirs.push(path.join(env.ChocolateyInstall, "bin"));

  for (const installRoot of [
    { root: path.join(home, ".local", "share", "mise", "installs", "node"), segments: ["bin"] },
    { root: path.join(home, ".nvm", "versions", "node"), segments: ["bin"] },
    { root: path.join(home, ".local", "share", "fnm", "node-versions"), segments: ["installation", "bin"] },
  ]) {
    dirs.push(...existingChildBinDirs(installRoot.root, installRoot.segments, options));
  }

  if (platform !== "win32") dirs.push("/opt/homebrew/bin", "/usr/local/bin");

  return Array.from(new Set(dirs.filter(Boolean)));
}

function pathDirs(options: AgentResolverOptions = {}): string[] {
  const env = resolverEnv(options);
  return (env.PATH || env.Path || "")
    .split(path.delimiter)
    .map((dir) => dir.trim())
    .filter(Boolean);
}

function executableCandidates(raw: string, options: AgentResolverOptions = {}): string[] {
  const platform = resolverPlatform(options);
  if (platform !== "win32") return [raw];
  if (path.extname(raw)) return [raw];

  const env = resolverEnv(options);
  const pathext = (env.PATHEXT || ".EXE;.CMD;.BAT;.COM")
    .split(";")
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean);
  const preferred = [".exe", ".cmd", ".bat", ".com"];
  const extra = pathext.filter((ext) => !preferred.includes(ext) && ext !== ".ps1");
  return [...preferred, ...extra, ""].map((ext) => `${raw}${ext}`);
}

function isPathLike(value: string): boolean {
  return path.isAbsolute(value) || value.includes("/") || value.includes("\\");
}

function resolveInDirectory(bin: string, dir: string, options: AgentResolverOptions): string | undefined {
  for (const candidate of executableCandidates(path.join(dir, bin), options)) {
    if (fileExists(candidate, options)) return candidate;
  }
  return undefined;
}

function resolvePathLike(value: string, options: AgentResolverOptions): string | undefined {
  for (const candidate of executableCandidates(value, options)) {
    if (fileExists(candidate, options)) return candidate;
  }
  return undefined;
}

function resolveBinFromDirs(bin: string, dirs: string[], options: AgentResolverOptions): string | undefined {
  if (isPathLike(bin)) return resolvePathLike(bin, options);
  for (const dir of dirs) {
    const resolved = resolveInDirectory(bin, dir, options);
    if (resolved) return resolved;
  }
  return undefined;
}

export function resolveAgentExecutable(
  agent: AgentDefinition,
  configuredAgentEnv: Record<string, string> = {},
  options: AgentResolverOptions = {}
): ResolvedAgentExecutable | undefined {
  const env = resolverEnv(options);
  const envKey = AGENT_BIN_ENV_KEYS[agent.id];
  const configuredBin = envKey ? configuredAgentEnv[envKey] : undefined;
  const processEnvBin = envKey ? env[envKey] : undefined;

  if (configuredBin) {
    const resolved = resolveBinFromDirs(configuredBin, [...pathDirs(options), ...wellKnownUserToolchainBins(options)], options);
    if (resolved) return { bin: resolved, source: "configured" };
  }

  if (processEnvBin) {
    const resolved = resolveBinFromDirs(processEnvBin, [...pathDirs(options), ...wellKnownUserToolchainBins(options)], options);
    if (resolved) return { bin: resolved, source: "env" };
  }

  const pathResolved = resolveBinFromDirs(agent.bin, pathDirs(options), options);
  if (pathResolved) return { bin: pathResolved, source: "path" };

  const wellKnownResolved = resolveBinFromDirs(agent.bin, wellKnownUserToolchainBins(options), options);
  if (wellKnownResolved) return { bin: wellKnownResolved, source: "well_known" };

  for (const fallbackBin of agent.fallbackBins ?? []) {
    const fallbackResolved = resolveBinFromDirs(fallbackBin, [...pathDirs(options), ...wellKnownUserToolchainBins(options)], options);
    if (fallbackResolved) return { bin: fallbackResolved, source: "fallback" };
  }

  return undefined;
}

function quoteWindowsCommandArg(value: string): string {
  if (!/[\s"&<>|^%]/.test(value)) return value;
  const escaped = value.replace(/"/g, '""').replace(/%/g, '"^%"');
  return `"${escaped}"`;
}

export function createAgentCommandInvocation(
  command: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): { command: string; args: string[]; windowsVerbatimArguments?: boolean } {
  if (platform === "win32" && /\.(bat|cmd)$/i.test(command)) {
    const inner = [command, ...args].map(quoteWindowsCommandArg).join(" ");
    return {
      command: env.ComSpec ?? process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", `"${inner}"`],
      windowsVerbatimArguments: true,
    };
  }

  return { command, args };
}

async function commandVersion(bin: string, args: string[] = ["--version"], options: AgentResolverOptions = {}): Promise<string | undefined> {
  try {
    const env = resolverEnv(options);
    const invocation = createAgentCommandInvocation(bin, args, env, resolverPlatform(options));
    const { stdout, stderr } = await execFileAsync(invocation.command, invocation.args, {
      timeout: 2500,
      windowsHide: true,
      windowsVerbatimArguments: invocation.windowsVerbatimArguments,
      env,
    });
    return (stdout || stderr).trim().split(/\r?\n/)[0]?.slice(0, 160);
  } catch {
    return undefined;
  }
}

function candidateBins(
  agent: AgentDefinition,
  configuredAgentEnv: Record<string, string> = {},
  options: AgentResolverOptions = {}
): string[] {
  const env = resolverEnv(options);
  const envKey = AGENT_BIN_ENV_KEYS[agent.id];
  const configuredBin = envKey ? configuredAgentEnv[envKey] : undefined;
  const envBin = envKey ? env[envKey] : undefined;
  return Array.from(new Set([configuredBin, envBin, agent.bin, ...(agent.fallbackBins ?? [])].filter((value): value is string => Boolean(value?.trim()))));
}

async function resolveAgent(
  agent: AgentDefinition,
  configuredAgentEnv: Record<string, string> = {},
  options: AgentResolverOptions = {}
): Promise<{ bin: string; version: string; source: AgentPathSource } | undefined> {
  const resolved = resolveAgentExecutable(agent, configuredAgentEnv, options);
  if (!resolved) return undefined;
  const version = await commandVersion(resolved.bin, agent.versionArgs, options);
  if (version) return { ...resolved, version };
  return undefined;
}

export async function listAgents(agentCliEnv?: AgentCliEnv, options: AgentResolverOptions = {}): Promise<AgentInfo[]> {
  return Promise.all(
    AGENT_DEFS.map(async (agent) => {
      const configuredAgentEnv = agentCliEnvForAgent(agentCliEnv, agent.id);
      const resolved = await resolveAgent(agent, configuredAgentEnv, options);
      const { buildArgs, ...info } = agent;
      const previewBin = resolved?.bin ?? candidateBins(agent, configuredAgentEnv, options)[0] ?? agent.bin;
      return {
        ...info,
        available: Boolean(resolved),
        version: resolved?.version,
        path: resolved?.bin,
        pathSource: resolved?.source,
        models: modelList(agent.fallbackModels),
        capabilities: capabilitiesForAgent(agent),
        commandPreview: [
          previewBin,
          ...buildArgs({
            model: DEFAULT_AGENT_MODEL,
            reasoning: DEFAULT_AGENT_MODEL,
            permissionMode: agent.permissionMode,
            prompt: "<prompt>",
          }),
        ],
      };
    })
  );
}

export type AgentTestKind = "success" | "agent_not_installed" | "not_found_model" | "timeout" | "agent_spawn_failed" | "unknown";

export interface AgentTestInput {
  agentId: string;
  model?: string;
  reasoning?: string;
  agentCliEnv?: AgentCliEnv;
}

export interface AgentTestResult {
  ok: boolean;
  kind: AgentTestKind;
  agent?: AgentInfo;
  error?: string;
  latencyMs: number;
  model: string;
  agentName: string;
}

export interface AgentTextInput {
  agentId: string;
  prompt: string;
  model?: string;
  reasoning?: string;
  agentCliEnv?: AgentCliEnv;
  timeoutMs?: number;
  onEvent?: (event: NormalizedRuntimeEvent) => void | Promise<void>;
}

function looksLikeModelError(value: string): boolean {
  return (
    /model|deployment/i.test(value) &&
    /not found|unknown|invalid|404|requires a newer version|not supported|no access|does not support/i.test(value)
  );
}

function testInput(input: string | AgentTestInput): AgentTestInput {
  return typeof input === "string" ? { agentId: input } : input;
}

export async function testAgent(input: string | AgentTestInput): Promise<AgentTestResult> {
  const request = testInput(input);
  const start = Date.now();
  const model = request.model?.trim() || DEFAULT_AGENT_MODEL;
  const def = AGENT_DEFS.find((item) => item.id === request.agentId);
  const agentName = def?.name ?? request.agentId;
  if (!def) {
    return { ok: false, kind: "agent_not_installed", error: "Unknown agent", latencyMs: Date.now() - start, model, agentName };
  }

  const configuredAgentEnv = agentCliEnvForAgent(request.agentCliEnv, request.agentId);
  const resolved = resolveAgentExecutable(def, configuredAgentEnv);
  const agents = await listAgents(request.agentCliEnv);
  const agent = agents.find((item) => item.id === request.agentId);
  if (!resolved) {
    return {
      ok: false,
      kind: "agent_not_installed",
      agent,
      error: `${def.name} CLI não foi encontrada no PATH nem nos diretórios locais de toolchain.`,
      latencyMs: Date.now() - start,
      model,
      agentName: def.name,
    };
  }

  const prompt = "Respond with exactly: ok";
  const args = def.buildArgs({
    model,
    reasoning: request.reasoning?.trim() || DEFAULT_AGENT_MODEL,
    permissionMode: def.permissionMode,
    prompt,
  });

  const result = await new Promise<{ ok: boolean; kind: AgentTestKind; error?: string }>((resolve) => {
    const env = { ...process.env, ...def.env, ...configuredAgentEnv };
    const invocation = createAgentCommandInvocation(resolved.bin, args, env);
    const child = spawn(invocation.command, invocation.args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: invocation.windowsVerbatimArguments,
    });

    let settled = false;
    let stdout = "";
    let stderr = "";
    const finish = (value: { ok: boolean; kind: AgentTestKind; error?: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish({ ok: false, kind: "timeout", error: `${def.name} não finalizou o teste a tempo.` });
    }, 20_000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk).slice(0, 8000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk).slice(0, 8000);
    });
    child.on("error", (error) => finish({ ok: false, kind: "agent_spawn_failed", error: error.message }));
    child.on("close", (code) => {
      if (code === 0) {
        finish({ ok: true, kind: "success" });
        return;
      }
      const error = (extractAgentError(stdout) || stderr || stdout || `${def.name} exited with code ${code}`).trim().slice(0, 500);
      finish({ ok: false, kind: looksLikeModelError(error) ? "not_found_model" : "agent_spawn_failed", error });
    });

    if (def.promptViaStdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }
  });

  return {
    ok: result.ok,
    kind: result.kind,
    agent,
    error: result.error,
    latencyMs: Date.now() - start,
    model,
    agentName: def.name,
  };
}

export function extractAgentText(stdout: string): string {
  const text = collectTextFromEvents(parseRuntimeOutput("codex", "json-event-stream", stdout));
  if (text) return text;

  const cleaned = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("{"))
    .join("\n")
    .trim();

  return cleaned || stdout.trim();
}

export function extractAgentError(stdout: string): string {
  return firstErrorFromEvents(parseRuntimeOutput("codex", "json-event-stream", stdout))?.message.slice(0, 1200) ?? "";
}

export async function runAgentText(input: AgentTextInput): Promise<{ content: string; agentName: string; model: string }> {
  const def = AGENT_DEFS.find((item) => item.id === input.agentId);
  if (!def) throw new Error(`Unknown agent "${input.agentId}".`);

  const model = input.model?.trim() || DEFAULT_AGENT_MODEL;
  const reasoning = input.reasoning?.trim() || DEFAULT_AGENT_MODEL;
  const configuredAgentEnv = agentCliEnvForAgent(input.agentCliEnv, input.agentId);
  const resolved = resolveAgentExecutable(def, configuredAgentEnv);
  if (!resolved) {
    throw new Error(`${def.name} CLI não foi encontrada no PATH nem nos diretórios locais de toolchain.`);
  }

  const args = def.buildArgs({
    model,
    reasoning,
    permissionMode: def.permissionMode,
    prompt: input.prompt,
  });

  const env = {
    ...process.env,
    OS_NODE_BIN: process.execPath,
    OS_BIN: path.join(process.cwd(), "scripts", "open-studio.mjs"),
    OS_DAEMON_URL: process.env.OS_DAEMON_URL || process.env.OPEN_STUDIO_DAEMON_URL || "http://127.0.0.1:3000",
    OS_PROJECT_ID: process.env.OS_PROJECT_ID || "default",
    OS_PROJECT_DIR: process.cwd(),
    ...def.env,
    ...configuredAgentEnv,
  };
  const promptInput = await preparePromptInput({
    prompt: input.prompt,
    args,
    promptViaStdin: def.promptViaStdin,
  });
  const invocation = createAgentCommandInvocation(resolved.bin, promptInput.args, env);

  const events: NormalizedRuntimeEvent[] = [];
  const parser = createRuntimeParser(def.id, def.streamFormat, (event) => {
    events.push(event);
    void input.onEvent?.(event);
  });

  const output = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      windowsVerbatimArguments: invocation.windowsVerbatimArguments,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve({ stdout, stderr });
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(new Error(`${def.name} demorou demais para responder.`));
    }, input.timeoutMs ?? 120_000);

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text.slice(0, 1_000_000);
      parser.feed(text);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk).slice(0, 120_000);
    });
    child.on("error", (error) => finish(error));
    child.on("close", (code) => {
      parser.flush();
      if (code === 0) {
        finish();
        return;
      }
      const detail = (
        firstErrorFromEvents(events)?.message ||
        extractAgentError(stdout) ||
        stderr ||
        stdout ||
        `${def.name} exited with code ${code}`
      )
        .trim()
        .slice(0, 1200);
      finish(new Error(detail));
    });

    if (promptInput.mode === "stdin") {
      child.stdin.write(promptInput.stdin);
      child.stdin.end();
    }
  });

  const content = collectTextFromEvents(events) || extractAgentText(output.stdout);
  if (!content) {
    throw new Error((output.stderr || `${def.name} não retornou texto.`).trim().slice(0, 1200));
  }

  return { content, agentName: def.name, model };
}
