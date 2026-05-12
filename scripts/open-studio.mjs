#!/usr/bin/env node

const args = process.argv.slice(2);

function printHelp() {
  console.log(`Usage:
  open-studio media generate --surface image --prompt "<text>" [--model <id>] [--provider <id>] [--aspect 16:9]
  open-studio media wait <taskId>
  open-studio media cancel <taskId>
  open-studio research search --query "<text>" [--max-sources 6]

Env:
  OS_DAEMON_URL or OPEN_STUDIO_DAEMON_URL defaults to http://127.0.0.1:3000
  OS_PROJECT_ID is forwarded when set, or use --project <id>
`);
}

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      positional.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index++;
  }
  return { flags, positional };
}

function daemonUrl(flags = {}) {
  return String(flags["daemon-url"] || process.env.OS_DAEMON_URL || process.env.OPEN_STUDIO_DAEMON_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || response.statusText };
  }
}

async function mediaGenerate(rawArgs) {
  const { flags } = parseFlags(rawArgs);
  if (flags.help || flags.h) {
    printHelp();
    return;
  }

  const prompt = typeof flags.prompt === "string" ? flags.prompt : "";
  const surface = typeof flags.surface === "string" ? flags.surface : "image";
  if (!prompt && surface === "image") {
    console.error("missing required --prompt");
    process.exit(2);
  }

  const response = await fetch(`${daemonUrl(flags)}/api/media/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      surface,
      prompt,
      model: typeof flags.model === "string" ? flags.model : undefined,
      providerId: typeof flags.provider === "string" ? flags.provider : undefined,
      aspectRatio: typeof flags.aspect === "string" ? flags.aspect : undefined,
      output: typeof flags.output === "string" ? flags.output : undefined,
      projectId: typeof flags.project === "string" ? flags.project : process.env.OS_PROJECT_ID || undefined,
      n: Number.isFinite(Number(flags.n)) ? Number(flags.n) : undefined,
    }),
  }).catch((error) => {
    console.error(`failed to reach daemon at ${daemonUrl(flags)}: ${error.message}`);
    process.exit(3);
  });

  const json = await readJson(response);
  if (!response.ok) {
    console.error(json.error || json.details || `daemon ${response.status}`);
    if (Array.isArray(json.diagnostics)) {
      for (const item of json.diagnostics) {
        if (item?.action) console.error(item.action);
      }
    }
    if (json.taskId) console.log(JSON.stringify({ taskId: json.taskId, status: json.status || "failed" }));
    process.exit(5);
  }

  if (json.file) {
    console.log(JSON.stringify({ file: json.file }));
    return;
  }
  if (json.taskId) {
    console.log(JSON.stringify({ taskId: json.taskId, status: json.status || "queued", nextSince: 0 }));
    process.exit(2);
  }

  console.error("daemon did not return a file or taskId");
  process.exit(4);
}

async function mediaWait(rawArgs) {
  const { flags, positional } = parseFlags(rawArgs);
  const taskId = positional[0];
  if (!taskId || flags.help || flags.h) {
    printHelp();
    process.exit(taskId ? 0 : 2);
  }

  const response = await fetch(`${daemonUrl(flags)}/api/media/tasks/${encodeURIComponent(taskId)}/wait`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ since: flags.since || 0 }),
  }).catch((error) => {
    console.error(`failed to reach daemon at ${daemonUrl(flags)}: ${error.message}`);
    process.exit(3);
  });
  const json = await readJson(response);

  if (!response.ok) {
    console.error(json.error || json.details || `daemon ${response.status}`);
    if (Array.isArray(json.diagnostics)) {
      for (const item of json.diagnostics) {
        if (item?.action) console.error(item.action);
      }
    }
    process.exit(5);
  }
  if (json.file) {
    console.log(JSON.stringify({ file: json.file }));
    return;
  }
  console.log(JSON.stringify({ taskId, status: json.status || "running", nextSince: json.nextSince ?? json.progress?.length ?? 0 }));
  process.exit(2);
}

async function mediaCancel(rawArgs) {
  const { flags, positional } = parseFlags(rawArgs);
  const taskId = positional[0];
  if (!taskId || flags.help || flags.h) {
    printHelp();
    process.exit(taskId ? 0 : 2);
  }

  const response = await fetch(`${daemonUrl(flags)}/api/media/tasks/${encodeURIComponent(taskId)}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: typeof flags.reason === "string" ? flags.reason : undefined }),
  }).catch((error) => {
    console.error(`failed to reach daemon at ${daemonUrl(flags)}: ${error.message}`);
    process.exit(3);
  });
  const json = await readJson(response);

  if (!response.ok) {
    console.error(json.error || json.details || `daemon ${response.status}`);
    process.exit(5);
  }
  console.log(JSON.stringify({ taskId, status: json.task?.status || "cancelled" }));
}

async function researchSearch(rawArgs) {
  const { flags } = parseFlags(rawArgs);
  if (flags.help || flags.h) {
    printHelp();
    return;
  }

  const query = typeof flags.query === "string" ? flags.query : "";
  if (!query.trim()) {
    console.error("missing required --query");
    process.exit(2);
  }

  const response = await fetch(`${daemonUrl(flags)}/api/research/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      maxSources: Number.isFinite(Number(flags["max-sources"])) ? Number(flags["max-sources"]) : undefined,
      projectId: typeof flags.project === "string" ? flags.project : process.env.OS_PROJECT_ID || undefined,
    }),
  }).catch((error) => {
    console.error(`failed to reach daemon at ${daemonUrl(flags)}: ${error.message}`);
    process.exit(3);
  });
  const json = await readJson(response);

  if (!response.ok) {
    console.error(json.error || json.details || `daemon ${response.status}`);
    if (Array.isArray(json.diagnostics)) {
      for (const item of json.diagnostics) {
        if (item?.action) console.error(item.action);
      }
    }
    process.exit(5);
  }
  console.log(JSON.stringify(json.research || json));
}

async function main() {
  const [section, command, ...rest] = args;
  if (!section || section === "help" || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }
  if (section === "media" && command === "generate") return mediaGenerate(rest);
  if (section === "media" && command === "wait") return mediaWait(rest);
  if (section === "media" && command === "cancel") return mediaCancel(rest);
  if (section === "research" && command === "search") return researchSearch(rest);
  console.error(`unknown command: ${args.join(" ")}`);
  printHelp();
  process.exit(2);
}

await main();
