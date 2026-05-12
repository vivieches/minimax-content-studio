import { startDaemonServer } from "./server";

export type DaemonCliCommand = "serve" | "health" | "help";

export type ParsedDaemonCliArgs = {
  command: DaemonCliCommand;
  flags: Record<string, string | boolean>;
};

export function parseDaemonCliArgs(argv: string[]): ParsedDaemonCliArgs {
  const [command = "help", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index++) {
    const item = rest[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index++;
  }

  if (command === "serve" || command === "health") return { command, flags };
  return { command: "help", flags };
}

export async function runDaemonCli(argv: string[], io: Pick<typeof console, "log" | "error"> = console) {
  const parsed = parseDaemonCliArgs(argv);
  if (parsed.command === "serve") {
    const port = Number(parsed.flags.port ?? process.env.OPEN_STUDIO_DAEMON_PORT ?? 7456);
    const host = String(parsed.flags.host ?? process.env.OPEN_STUDIO_DAEMON_HOST ?? "127.0.0.1");
    const server = await startDaemonServer({
      host,
      port: Number.isFinite(port) ? port : 7456,
      storageDir: typeof parsed.flags.storage === "string" ? parsed.flags.storage : undefined,
    });
    io.log(JSON.stringify({ ok: true, service: "open-studio-daemon", url: server.url }));
    return server;
  }

  if (parsed.command === "health") {
    const url = String(parsed.flags.url ?? process.env.OPEN_STUDIO_DAEMON_URL ?? "http://127.0.0.1:7456").replace(
      /\/$/,
      "",
    );
    const response = await fetch(`${url}/api/health`);
    io.log(JSON.stringify(await response.json()));
    return null;
  }

  io.error("Usage: open-studio-daemon serve --port 7456 | open-studio-daemon health --url http://127.0.0.1:7456");
  return null;
}
